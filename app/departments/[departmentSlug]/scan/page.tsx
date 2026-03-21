import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthenticatedSessionContext } from "@/lib/auth/session";

type ScanFallbackPageProps = {
  params: Promise<{
    departmentSlug: string;
  }>;
  searchParams: Promise<{
    code?: string;
  }>;
};

export default async function ScanFallbackPage({ params, searchParams }: ScanFallbackPageProps) {
  const [{ departmentSlug }, resolvedSearchParams, session] = await Promise.all([
    params,
    searchParams,
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
    const fallbackCode = resolvedSearchParams.code
      ? `?code=${encodeURIComponent(resolvedSearchParams.code)}`
      : "";

    redirect(`/departments/${session.user.department.slug}/scan${fallbackCode}`);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-3">
        <Badge variant="secondary">{session.user.department.name} scan intake</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Unrecognized order</h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          This scan does not match a recognized order or inventory pattern yet.
        </p>
      </div>

      <Card className="border-border/70 bg-card/75">
        <CardHeader>
          <CardTitle>Captured scan</CardTitle>
          <CardDescription>Please verify the label and try again.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
            <p className="text-sm text-muted-foreground">Raw scanner value</p>
            <p className="mt-1 font-mono text-lg text-foreground">{resolvedSearchParams.code ?? "No code supplied"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
