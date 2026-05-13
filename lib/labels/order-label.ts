import { PDFDocument, StandardFonts } from "pdf-lib";
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
};

export const ORDER_LABEL_LAYOUT: OrderLabelLayout = {
  labelWidthIn: 3.5,
  labelHeightIn: 1.13,
  qrSizeIn: 1.13,
  qrOffsetXIn: 0,
  qrOffsetYIn: 0,
  qrMarginModules: 1,
  qrPixelSize: 720,
  jobIdFontSizePt: 34,
  jobIdGapPt: 10,
};

export async function createOrderLabelPdf(orderId: string) {
  const normalizedOrderId = normalizeOrderId(orderId);
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
  const jobIdMaxHeight = pageHeight * 0.76;
  const jobIdWidthAtLayoutSize = labelFont.widthOfTextAtSize(jobIdText, layout.jobIdFontSizePt);
  const jobIdHeightAtLayoutSize = labelFont.heightAtSize(layout.jobIdFontSizePt);
  const jobIdFontSize = Math.min(
    layout.jobIdFontSizePt,
    (layout.jobIdFontSizePt * jobIdAreaWidth) / jobIdWidthAtLayoutSize,
    (layout.jobIdFontSizePt * jobIdMaxHeight) / jobIdHeightAtLayoutSize,
  );
  const jobIdTextWidth = labelFont.widthOfTextAtSize(jobIdText, jobIdFontSize);
  const jobIdTextHeight = labelFont.heightAtSize(jobIdFontSize);
  const jobIdX = jobIdAreaX + (jobIdAreaWidth - jobIdTextWidth) / 2;
  const jobIdY = (pageHeight - jobIdTextHeight) / 2;

  page.drawText(jobIdText, {
    x: jobIdX,
    y: jobIdY,
    font: labelFont,
    size: jobIdFontSize,
  });

  return {
    layout,
    normalizedOrderId,
    orderUrl,
    pdfBytes: await pdf.save(),
    token,
  };
}
