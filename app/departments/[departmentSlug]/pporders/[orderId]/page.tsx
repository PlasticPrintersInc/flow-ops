import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AlertCircle, CheckCircle2, ExternalLink, FileText, Layers3 } from "lucide-react";

import { PrintOrderLabelButton } from "@/components/production/print-order-label-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthenticatedSessionContext } from "@/lib/auth/session";
import {
  getProofingProductionOrder,
  type ProofingDesignWithProofs,
  type ProofingStatus,
  type WorkOrderAttachment,
} from "@/lib/data/proofing-orders";
import { getQualityControlFlowRedirectUrl } from "@/lib/data/quality-control-flow";
import { getShippingOrderRedirectUrl } from "@/lib/data/shipping-orders";
import type { DepartmentSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type OrderRouteProps = {
  params: Promise<{
    departmentSlug: string;
    orderId: string;
  }>;
};

function getRequestOrigin(requestHeaders: Headers) {
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : undefined;
}

function isShippingDepartment(department: DepartmentSummary) {
  return department.slug === "shipping" || department.slug === "vp-shipping";
}

function statusTone(status?: ProofingStatus | null) {
  const statusName = status?.name?.toLowerCase() ?? "";

  if (statusName === "approved") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (statusName.includes("waiting")) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  if (statusName.includes("revision") || statusName.includes("change")) {
    return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  }

  if (statusName.includes("reject") || statusName.includes("cancel")) {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  return "border-border bg-background text-muted-foreground";
}

function StatusBadge({ status }: { status?: ProofingStatus | null }) {
  return (
    <Badge variant="outline" className={cn("w-fit gap-1.5", statusTone(status))}>
      {status?.name ?? "No status"}
    </Badge>
  );
}

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

function WorkOrderDocument({ workOrders }: { workOrders?: WorkOrderAttachment[] | null }) {
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

function DesignProofs({ designWithProofs }: { designWithProofs: ProofingDesignWithProofs }) {
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
        <StatusBadge status={design.status} />
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

export default async function OrderPage({ params }: OrderRouteProps) {
  const [{ departmentSlug, orderId }, session, requestHeaders] = await Promise.all([
    params,
    requireAuthenticatedSessionContext(),
    headers(),
  ]);

  if (!session.isConfigured) {
    redirect("/");
  }

  if (!session.user) {
    redirect("/login");
  }

  if (!session.user.department) {
    redirect("/");
  }

  if (departmentSlug !== session.user.department.slug) {
    redirect(`/departments/${session.user.department.slug}/pporders/${orderId}`);
  }

  if (session.user.department.slug === "quality-control") {
    const qualityControlLookup = await getQualityControlFlowRedirectUrl(orderId);

    if (qualityControlLookup.ok) {
      redirect(qualityControlLookup.redirectUrl);
    }

    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="rounded-xl border-destructive/30 bg-card/75">
          <CardHeader>
            <CardTitle>Quality control flow unavailable</CardTitle>
            <CardDescription>
              {qualityControlLookup.status
                ? `Airtable status ${qualityControlLookup.status}`
                : "Airtable configuration or lookup issue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
              {qualityControlLookup.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isShippingDepartment(session.user.department)) {
    const shippingLookup = await getShippingOrderRedirectUrl(orderId, getRequestOrigin(requestHeaders));

    if (shippingLookup.ok) {
      redirect(shippingLookup.redirectUrl);
    }

    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="rounded-xl border-destructive/30 bg-card/75">
          <CardHeader>
            <CardTitle>Shipping order unavailable</CardTitle>
            <CardDescription>Supabase jobs lookup issue</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
              {shippingLookup.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const loadResult = await getProofingProductionOrder(orderId, getRequestOrigin(requestHeaders));

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge variant="secondary">{session.user.department.name} production lane</Badge>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight">PP Order {orderId}</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Proofing, design, item, and work order data loaded from the proofing jobs API.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            {loadResult.ok ? <StatusBadge status={loadResult.order.job.status} /> : null}
            <PrintOrderLabelButton departmentSlug={departmentSlug} orderId={orderId} />
          </div>
        </div>
      </div>

      {loadResult.ok ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-xl border-border/70 bg-card/75">
              <CardHeader className="pb-3">
                <CardDescription>Items</CardDescription>
                <CardTitle className="text-3xl">{loadResult.order.items.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-xl border-border/70 bg-card/75">
              <CardHeader className="pb-3">
                <CardDescription>Designs</CardDescription>
                <CardTitle className="text-3xl">
                  {loadResult.order.items.reduce((total, item) => total + item.designs.length, 0) +
                    loadResult.order.unassignedDesigns.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-xl border-border/70 bg-card/75">
              <CardHeader className="pb-3">
                <CardDescription>Approved proofs</CardDescription>
                <CardTitle className="text-3xl">
                  {loadResult.order.items.reduce(
                    (total, item) =>
                      total + item.designs.filter((design) => Boolean(design.approvedProof)).length,
                    0,
                  ) +
                    loadResult.order.unassignedDesigns.filter((design) => Boolean(design.approvedProof)).length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="rounded-xl border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Job details</CardTitle>
              <CardDescription>Signed in as {session.user.displayName}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                <p className="text-sm text-muted-foreground">Scanned order ID</p>
                <p className="mt-1 font-mono text-lg text-foreground">{orderId}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                <p className="text-sm text-muted-foreground">Job status</p>
                <p className="mt-1 font-mono text-lg text-foreground">
                  {loadResult.order.job.status?.name ?? "No status"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {loadResult.order.items.map(({ item, orderItem, designs }) => (
              <Card key={item.id} className="rounded-xl border-border/70 bg-card/75">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle>{item.itemid ?? "Unnamed item"}</CardTitle>
                    </div>
                    <Badge variant="outline" className="w-fit gap-1.5">
                      <Layers3 className="size-3.5" />
                      {designs.length} {designs.length === 1 ? "design" : "designs"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-5 lg:grid-cols-2 lg:auto-rows-[760px]">
                    <WorkOrderDocument workOrders={orderItem?.work_order} />
                    {designs.map((designWithProofs) => (
                      <DesignProofs
                        key={designWithProofs.design.id}
                        designWithProofs={designWithProofs}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {loadResult.order.unassignedDesigns.length ? (
            <Card className="rounded-xl border-border/70 bg-card/75">
              <CardHeader>
                <CardTitle>Unassigned designs</CardTitle>
                <CardDescription>Designs linked to the job but not returned on an item.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadResult.order.unassignedDesigns.map((designWithProofs) => (
                  <DesignProofs key={designWithProofs.design.id} designWithProofs={designWithProofs} />
                ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : (
        <Card className="rounded-xl border-destructive/30 bg-card/75">
          <CardHeader>
            <CardTitle>Proofing data unavailable</CardTitle>
            <CardDescription>
              {loadResult.status ? `API status ${loadResult.status}` : "Configuration or API request issue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
              {loadResult.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
