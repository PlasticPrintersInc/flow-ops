type CreatePrintNodePdfJobInput = {
  pdfBytes: Uint8Array;
  title: string;
};

function getPrintNodeApiKey() {
  const apiKey = process.env.PRINTNODE_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("PRINTNODE_API_KEY is not configured.");
  }

  return apiKey;
}

function getPrintNodePrinterId() {
  const printerId = Number(process.env.PRINTNODE_PRINTER_ID?.trim());

  if (!Number.isInteger(printerId) || printerId <= 0) {
    throw new Error("PRINTNODE_PRINTER_ID is not configured.");
  }

  return printerId;
}

export async function createPrintNodePdfJob({ pdfBytes, title }: CreatePrintNodePdfJobInput) {
  const response = await fetch("https://api.printnode.com/printjobs", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${getPrintNodeApiKey()}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: Buffer.from(pdfBytes).toString("base64"),
      contentType: "pdf_base64",
      printerId: getPrintNodePrinterId(),
      source: "Flow Ops",
      title,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`PrintNode rejected the print job: ${responseText || response.statusText}`);
  }

  return Number(responseText);
}
