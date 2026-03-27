import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthenticatedSessionContext } from "@/lib/auth/session";

type OrderRouteProps = {
  params: Promise<{
    departmentSlug: string;
    orderId: string;
  }>;
};

export default async function OrderPage({ params }: OrderRouteProps) {
  const [{ departmentSlug, orderId }, session] = await Promise.all([
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
    redirect(`/departments/${session.user.department.slug}/orders/${orderId}`);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">PP Order {orderId}</h1>
      </div>

      <Card className="border-border/70 bg-card/75">
        <CardHeader>
          <CardTitle>Placeholder {session.user.department.name} PP Order workspace</CardTitle>
          <CardDescription>Signed in as {session.user.displayName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
            <p className="text-sm text-muted-foreground">Scanned order ID</p>
            <p className="mt-1 font-mono text-lg text-foreground">{orderId}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
