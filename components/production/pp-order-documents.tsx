import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, FileText } from "lucide-react";

import { PpOrderStatusBadge } from "@/components/production/pp-order-status-badge";
import { Button } from "@/components/ui/button";
import type { ProofingDesignWithProofs, WorkOrderAttachment } from "@/lib/data/proofing-orders";

function formatTimestamp(timestamp?: string | null) {
  if (!timestamp) {
    return null;
  }

  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.valueOf())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

function pdfViewerUrl(url: string) {
  return `${url.split("#")[0]}#toolbar=0&navpanes=0&view=FitH`;
}

function DocumentPreview({
  eyebrow,
  title,
  url,
  openLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  url?: string | null;
  openLabel: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-[680px] flex-col overflow-hidden rounded-xl border border-border/70 bg-background/70 lg:h-full">
      <div className="space-y-3 border-b border-border/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase text-muted-foreground">{eyebrow}</p>
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <p className="truncate text-sm font-semibold text-foreground">{title}</p>
            </div>
          </div>
          {url ? (
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <a href={url} target="_blank" rel="noreferrer">
                {openLabel}
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          ) : null}
        </div>
        {children}
      </div>
      {url ? (
        <iframe className="min-h-0 flex-1 bg-white" src={pdfViewerUrl(url)} title={title} />
      ) : (
        <div className="flex flex-1 items-center justify-center bg-card/60 p-6">
          <p className="rounded-lg border border-dashed border-border/80 bg-background/65 px-3 py-2 text-sm text-muted-foreground">
            Document link was not returned.
          </p>
        </div>
      )}
    </div>
  );
}

export function WorkOrderDocument({ workOrders }: { workOrders?: WorkOrderAttachment[] | null }) {
  const workOrder = workOrders?.[0] ?? null;

  return (
    <DocumentPreview
      eyebrow="Work order"
      title={workOrder?.filename ?? "Work order"}
      url={workOrder?.url}
      openLabel="Open"
    />
  );
}

export function DesignProofs({ designWithProofs }: { designWithProofs: ProofingDesignWithProofs }) {
  const { design, approvedProof } = designWithProofs;
  const approvedAt = formatTimestamp(approvedProof?.approval_timestamp);

  return (
    <DocumentPreview
      eyebrow={design.design_name ?? "Unnamed design"}
      title={approvedProof?.proof_name ?? "Approved proof"}
      url={approvedProof?.proof_link}
      openLabel="Open proof"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PpOrderStatusBadge status={design.status} />
        {approvedProof ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
            <span>Approved proof{approvedAt ? ` on ${approvedAt}` : ""}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="size-4 shrink-0" />
            <span>No approved proof returned</span>
          </div>
        )}
      </div>
    </DocumentPreview>
  );
}
