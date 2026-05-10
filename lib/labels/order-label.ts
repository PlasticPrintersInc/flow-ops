import { PDFDocument } from "pdf-lib";
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
};

export const ORDER_LABEL_LAYOUT: OrderLabelLayout = {
  labelWidthIn: 3.5,
  labelHeightIn: 1.13,
  qrSizeIn: 1.04,
  qrOffsetXIn: 0,
  qrOffsetYIn: 0,
  qrMarginModules: 1,
  qrPixelSize: 720,
};

export async function createOrderLabelPdf(orderId: string) {
  const normalizedOrderId = normalizeOrderId(orderId);
  const token = encodeOrderId(normalizedOrderId);
  const orderUrl = `https://spmd.ai/o/${token}`;
  const layout = ORDER_LABEL_LAYOUT;
  const pageWidth = layout.labelWidthIn * POINTS_PER_INCH;
  const pageHeight = layout.labelHeightIn * POINTS_PER_INCH;
  const qrSize = layout.qrSizeIn * POINTS_PER_INCH;
  const qrX = (pageWidth - qrSize) / 2 + layout.qrOffsetXIn * POINTS_PER_INCH;
  const qrY = (pageHeight - qrSize) / 2 + layout.qrOffsetYIn * POINTS_PER_INCH;
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([pageWidth, pageHeight]);
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

  return {
    layout,
    normalizedOrderId,
    orderUrl,
    pdfBytes: await pdf.save(),
    token,
  };
}
