import { PDFDocument, StandardFonts, type PDFFont } from "pdf-lib";
import QRCode from "qrcode";

import { encodeOrderId, normalizeOrderId } from "@/lib/labels/order-code";

const POINTS_PER_INCH = 72;

type OrderLabelLayout = {
  labelWidthIn: number;
  labelHeightIn: number;
  qrSizeIn: number;
  qrOffsetXIn: number;
  qrOffsetYIn: number;
  qrMarginModules: number;
  qrPixelSize: number;
  jobIdFontSizePt: number;
  jobIdGapPt: number;
  orderNumberFontSizePt: number;
  stackLineGapPt: number;
};

export const ORDER_LABEL_LAYOUT: OrderLabelLayout = {
  labelWidthIn: 3.5,
  labelHeightIn: 1.13,
  qrSizeIn: 1.13,
  qrOffsetXIn: 0,
  qrOffsetYIn: 0,
  qrMarginModules: 1,
  qrPixelSize: 720,
  jobIdFontSizePt: 32,
  jobIdGapPt: 10,
  orderNumberFontSizePt: 18,
  stackLineGapPt: 4,
};

type CreateOrderLabelPdfOptions = {
  orderNumber?: string | null;
};

function fitTextStack({
  areaWidth,
  font,
  layout,
  pageHeight,
  primaryText,
  secondaryText,
}: {
  areaWidth: number;
  font: PDFFont;
  layout: OrderLabelLayout;
  pageHeight: number;
  primaryText: string;
  secondaryText: string | null;
}) {
  const baseLines = [
    {
      fontSize: layout.jobIdFontSizePt,
      text: primaryText,
    },
    ...(secondaryText
      ? [
          {
            fontSize: layout.orderNumberFontSizePt,
            text: secondaryText,
          },
        ]
      : []),
  ];
  const baseTextWidths = baseLines.map((line) => font.widthOfTextAtSize(line.text, line.fontSize));
  const baseLineHeights = baseLines.map((line) => font.heightAtSize(line.fontSize));
  const baseStackHeight =
    baseLineHeights.reduce((total, height) => total + height, 0) +
    Math.max(baseLines.length - 1, 0) * layout.stackLineGapPt;
  const maxWidthRatio = Math.min(...baseTextWidths.map((width) => areaWidth / width));
  const maxHeightRatio = (pageHeight * 0.82) / baseStackHeight;
  const scale = Math.min(1, maxWidthRatio, maxHeightRatio);

  return baseLines.map((line) => ({
    fontSize: line.fontSize * scale,
    text: line.text,
  }));
}

export async function createOrderLabelPdf(
  orderId: string,
  options: CreateOrderLabelPdfOptions = {},
) {
  const normalizedOrderId = normalizeOrderId(orderId);
  const orderNumber = options.orderNumber?.trim() || null;
  const token = encodeOrderId(normalizedOrderId);
  const orderUrl = `https://spmd.ai/o/${token}`;
  const layout = ORDER_LABEL_LAYOUT;
  const pageWidth = layout.labelWidthIn * POINTS_PER_INCH;
  const pageHeight = layout.labelHeightIn * POINTS_PER_INCH;
  const qrSize = layout.qrSizeIn * POINTS_PER_INCH;
  const qrX = layout.qrOffsetXIn * POINTS_PER_INCH;
  const qrY = (pageHeight - qrSize) / 2 + layout.qrOffsetYIn * POINTS_PER_INCH;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([pageWidth, pageHeight]);
  const labelFont = await pdf.embedFont(StandardFonts.Helvetica);
  const qrPng = await QRCode.toBuffer(orderUrl, {
    errorCorrectionLevel: "M",
    margin: layout.qrMarginModules,
    type: "png",
    width: layout.qrPixelSize,
  });
  const qrImage = await pdf.embedPng(qrPng);

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  const jobIdText = `${normalizedOrderId}`;
  const jobIdAreaX = qrX + qrSize + layout.jobIdGapPt;
  const jobIdAreaWidth = pageWidth - jobIdAreaX;
  const jobIdLines = fitTextStack({
    areaWidth: jobIdAreaWidth,
    font: labelFont,
    layout,
    pageHeight,
    primaryText: jobIdText,
    secondaryText: orderNumber,
  });
  const jobIdLineHeights = jobIdLines.map((line) => labelFont.heightAtSize(line.fontSize));
  const stackLineGap = layout.stackLineGapPt * (jobIdLines[0].fontSize / layout.jobIdFontSizePt);
  const jobIdStackHeight =
    jobIdLineHeights.reduce((total, height) => total + height, 0) +
    Math.max(jobIdLines.length - 1, 0) * stackLineGap;
  let jobIdY = (pageHeight - jobIdStackHeight) / 2 + jobIdStackHeight;

  jobIdLines.forEach((line, index) => {
    const lineHeight = jobIdLineHeights[index];
    const lineTextWidth = labelFont.widthOfTextAtSize(line.text, line.fontSize);

    jobIdY -= lineHeight;

    page.drawText(line.text, {
      x: jobIdAreaX + (jobIdAreaWidth - lineTextWidth) / 2,
      y: jobIdY,
      font: labelFont,
      size: line.fontSize,
    });

    jobIdY -= stackLineGap;
  });

  return {
    layout,
    normalizedOrderId,
    orderUrl,
    pdfBytes: await pdf.save(),
    token,
  };
}
