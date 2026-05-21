import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDepartmentRouteSession } from "@/lib/auth/department-route";
import { buildDepartmentDestination } from "@/lib/department-routes";

type InventoryRouteProps = {
  params: Promise<{
    departmentSlug: string;
    inventoryId: string;
  }>;
};

export default async function InventoryPage({ params }: InventoryRouteProps) {
  const { departmentSlug, inventoryId } = await params;
  const session = await requireDepartmentRouteSession(departmentSlug, (activeDepartmentSlug) =>
    buildDepartmentDestination(activeDepartmentSlug, "inventory", inventoryId),
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge variant="secondary">{session.user.department.name} inventory lane</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Inventory {inventoryId}</h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          No inventory workspace is active in Flow Ops for this launch.
        </p>
      </div>

      <Card className="border-border/70 bg-card/75">
        <CardHeader>
          <CardTitle>Inventory scan captured</CardTitle>
          <CardDescription>
            Signed in as {session.user.displayName} for {session.user.department.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
            <p className="text-sm text-muted-foreground">Scanned inventory ID</p>
            <p className="mt-1 font-mono text-lg text-foreground">{inventoryId}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
