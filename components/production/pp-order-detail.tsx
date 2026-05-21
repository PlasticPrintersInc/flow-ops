import { Layers3 } from "lucide-react";

import { DesignProofs, WorkOrderDocument } from "@/components/production/pp-order-documents";
import { PpOrderStatusBadge } from "@/components/production/pp-order-status-badge";
import { PrintOrderLabelButton } from "@/components/production/print-order-label-button";
import { ProductionErrorCard } from "@/components/production/production-error-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ProofingOrderLoadResult,
  ProofingProductionOrder,
} from "@/lib/data/proofing-orders";

type PpOrderDetailProps = {
  departmentName: string;
  departmentSlug: string;
  displayName: string;
  loadResult: ProofingOrderLoadResult;
  orderId: string;
};

function countDesigns(order: ProofingProductionOrder) {
  return (
    order.items.reduce((total, item) => total + item.designs.length, 0) +
    order.unassignedDesigns.length
  );
}

function countApprovedProofs(order: ProofingProductionOrder) {
  return (
    order.items.reduce(
      (total, item) => total + item.designs.filter((design) => Boolean(design.approvedProof)).length,
      0,
    ) + order.unassignedDesigns.filter((design) => Boolean(design.approvedProof)).length
  );
}

export function PpOrderDetail({
  departmentName,
  departmentSlug,
  displayName,
  loadResult,
  orderId,
}: PpOrderDetailProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge variant="secondary">{departmentName} production lane</Badge>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight">PP Order {orderId}</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Proofing, design, item, and work order data loaded from the proofing jobs API.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            {loadResult.ok ? <PpOrderStatusBadge status={loadResult.order.job.status} /> : null}
            <PrintOrderLabelButton
              departmentSlug={departmentSlug}
              orderId={orderId}
              orderNumber={loadResult.ok ? loadResult.order.orderNumber : null}
            />
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
                <CardTitle className="text-3xl">{countDesigns(loadResult.order)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="rounded-xl border-border/70 bg-card/75">
              <CardHeader className="pb-3">
                <CardDescription>Approved proofs</CardDescription>
                <CardTitle className="text-3xl">{countApprovedProofs(loadResult.order)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="rounded-xl border-border/70 bg-card/75">
            <CardHeader>
              <CardTitle>Job details</CardTitle>
              <CardDescription>Signed in as {displayName}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
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
              <div className="rounded-xl border border-border/70 bg-background/75 p-4">
                <p className="text-sm text-muted-foreground">Order number</p>
                <p className="mt-1 font-mono text-lg text-foreground">
                  {loadResult.order.orderNumber ?? "Not returned"}
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
        <ProductionErrorCard
          title="Proofing data unavailable"
          description={loadResult.status ? `API status ${loadResult.status}` : "Configuration or API request issue"}
          message={loadResult.message}
        />
      )}
    </div>
  );
}
