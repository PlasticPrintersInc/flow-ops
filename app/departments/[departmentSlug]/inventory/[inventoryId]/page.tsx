import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthenticatedSessionContext } from "@/lib/auth/session";

type InventoryRouteProps = {
  params: Promise<{
    departmentSlug: string;
    inventoryId: string;
  }>;
};

export default async function InventoryPage({ params }: InventoryRouteProps) {
  const [{ departmentSlug, inventoryId }, session] = await Promise.all([
    params,
    requireAuthenticatedSessionContext(),
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
    redirect(`/departments/${session.user.department.slug}/inventory/${inventoryId}`);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge variant="secondary">{session.user.department.name} inventory lane</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Inventory {inventoryId}</h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Inventory-style scans now route here for the active department.
        </p>
      </div>

      <Card className="border-border/70 bg-card/75">
        <CardHeader>
          <CardTitle>Placeholder inventory workspace</CardTitle>
          <CardDescription>Signed in as {session.user.displayName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
            <p className="text-sm text-muted-foreground">Scanned inventory ID</p>
            <p className="mt-1 font-mono text-lg text-foreground">{inventoryId}</p>
          </div>
          <div className="rounded-2xl border border-dashed border-border/80 bg-background/75 p-4">
            <p className="text-sm font-medium">Next step</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Connect inventory records, status, and department-specific actions here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
