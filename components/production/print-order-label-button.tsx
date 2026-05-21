"use client";

import { useActionState, useEffect } from "react";
import { Printer } from "lucide-react";

import {
  printOrderLabelAction,
  type PrintOrderLabelActionState,
} from "@/app/actions/production-labels";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PrintOrderLabelButtonProps = {
  departmentSlug: string;
  orderId: string;
  orderNumber?: string | null;
};

const INITIAL_PRINT_ORDER_LABEL_STATE: PrintOrderLabelActionState = {
  message: null,
  ok: false,
};

function downloadPdf(fileName: string, pdfBase64: string) {
  const binary = window.atob(pdfBase64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const url = window.URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function PrintOrderLabelButton({
  departmentSlug,
  orderId,
  orderNumber,
}: PrintOrderLabelButtonProps) {
  const [state, action, pending] = useActionState(
    printOrderLabelAction,
    INITIAL_PRINT_ORDER_LABEL_STATE,
  );

  useEffect(() => {
    if (!state.download) {
      return;
    }

    downloadPdf(state.download.fileName, state.download.pdfBase64);
  }, [state.download]);

  return (
    <form action={action} className="flex flex-col items-stretch gap-2 sm:items-end">
      <input name="departmentSlug" type="hidden" value={departmentSlug} />
      <input name="orderId" type="hidden" value={orderId} />
      <input name="orderNumber" type="hidden" value={orderNumber ?? ""} />
      <Button disabled={pending} type="submit">
        <Printer className="size-4" />
        {pending ? "Sending label..." : "Print order label"}
      </Button>
      {state.message ? (
        <p
          aria-live="polite"
          className={cn(
            "max-w-sm text-sm",
            state.ok ? "text-emerald-700 dark:text-emerald-300" : "text-destructive",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
