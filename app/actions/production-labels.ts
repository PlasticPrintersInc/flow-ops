"use server";

import { requireAuthenticatedSessionContext } from "@/lib/auth/session";
import { createOrderLabelPdf } from "@/lib/labels/order-label";
import { createPrintNodePdfJob } from "@/lib/printnode";

export type PrintOrderLabelActionState = {
  download?: {
    fileName: string;
    pdfBase64: string;
  };
  message: string | null;
  ok: boolean;
};

function isOrderLabelTestMode() {
  return process.env.ORDER_LABEL_TEST_MODE?.trim().toLowerCase() === "true";
}

export async function printOrderLabelAction(
  _previousState: PrintOrderLabelActionState,
  formData: FormData,
): Promise<PrintOrderLabelActionState> {
  const session = await requireAuthenticatedSessionContext();

  if (!session.isConfigured || !session.user?.department) {
    return {
      message: "Sign in to a department before printing labels.",
      ok: false,
    };
  }

  const departmentSlug = formData.get("departmentSlug");

  if (departmentSlug !== session.user.department.slug) {
    return {
      message: "Switch to this department before printing labels.",
      ok: false,
    };
  }

  const orderId = formData.get("orderId");

  if (typeof orderId !== "string") {
    return {
      message: "Order ID is missing.",
      ok: false,
    };
  }

  try {
    const label = await createOrderLabelPdf(orderId);

    if (isOrderLabelTestMode()) {
      return {
        download: {
          fileName: `order-label-${label.normalizedOrderId}.pdf`,
          pdfBase64: Buffer.from(label.pdfBytes).toString("base64"),
        },
        message: "Test label generated.",
        ok: true,
      };
    }

    const printJobId = await createPrintNodePdfJob({
      pdfBytes: label.pdfBytes,
      title: `Order label ${label.normalizedOrderId}`,
    });

    return {
      message: `Label sent to PrintNode${Number.isFinite(printJobId) ? ` as job ${printJobId}` : ""}.`,
      ok: true,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unable to print the label.",
      ok: false,
    };
  }
}
