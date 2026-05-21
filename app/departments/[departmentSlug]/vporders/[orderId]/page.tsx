import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireDepartmentRouteSession } from "@/lib/auth/department-route";
import { buildDepartmentDestination } from "@/lib/department-routes";

type VpOrderRouteProps = {
  params: Promise<{
    departmentSlug: string;
    orderId: string;
  }>;
};

export default async function VpOrderPage({ params }: VpOrderRouteProps) {
  const { departmentSlug, orderId } = await params;
  await requireDepartmentRouteSession(departmentSlug, (activeDepartmentSlug) =>
    buildDepartmentDestination(activeDepartmentSlug, "vporders", orderId),
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">VP Order {orderId}</h1>
      </div>

      <Card className="border-border/70 bg-card/75">
        <CardHeader>
          <CardTitle>VP order scan captured</CardTitle>
          <CardDescription>
            No VP order workflow is active in Flow Ops for this launch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
            <p className="text-sm text-muted-foreground">Scanned VP order ID</p>
            <p className="mt-1 font-mono text-lg text-foreground">{orderId}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
