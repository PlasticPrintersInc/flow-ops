import Link from "next/link";
import { redirect } from "next/navigation";

import { AppSetupPanel } from "@/components/setup/app-setup-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuthenticatedSessionContext } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await requireAuthenticatedSessionContext();

  if (!session.isConfigured) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6">
        <AppSetupPanel />
      </div>
    );
  }

  if (!session.user) {
    redirect("/login");
  }

  if (!session.user.department) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 sm:px-6">
        <Card className="w-full border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <Badge variant="secondary" className="w-fit bg-amber-500/15 text-amber-900 dark:text-amber-200">
              Department access needed
            </Badge>
            <CardTitle className="text-3xl">This user is signed in, but no department is active yet.</CardTitle>
            <CardDescription className="max-w-2xl text-base">
              Ask an administrator to add at least one record in <code>public.user_departments</code> for this
              user, then sign in again with the department you want to work in.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const departmentSlug = session.user.department.slug;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 px-6 py-8 shadow-[0_25px_90px_-40px_rgba(15,23,42,0.45)] backdrop-blur sm:px-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 lg:block" />
        <div className="relative flex flex-col gap-6 lg:max-w-3xl">
          <Badge variant="secondary" className="w-fit">
            {session.user.department.name} station
          </Badge>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Welcome back, {session.user.displayName.split(" ")[0]}.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              This starter shell is ready for user sign-in, department-aware routing, and fast scan entry from
              anywhere in the app.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/departments/${departmentSlug}/scan?code=FLOW-DEMO-1001`}>Open unrecognized scan</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/departments/${departmentSlug}/orders/24018`}>Preview order route</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/departments/${departmentSlug}/inventory/INV-7712`}>Preview inventory route</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/departments/${departmentSlug}/vporders/VP-24018`}>Preview VP order route</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-border/70 bg-card/75">
          <CardHeader>
            <CardTitle>What this first cut already handles</CardTitle>
            <CardDescription>Enough infrastructure to start building the internal workflows on top.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-sm font-medium text-foreground">User sign-in</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Users sign in by person, department, and PIN instead of typing an email address.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-sm font-medium text-foreground">Session-aware toolbar</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The bottom bar stays on every page and immediately shows who is logged in and where they are signed
                in.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-sm font-medium text-foreground">Scanner-ready routing</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The scan field can be focused globally with <kbd className="rounded border px-1.5 py-0.5">Ctrl</kbd>/
                <kbd className="rounded border px-1.5 py-0.5">Cmd</kbd> +{" "}
                <kbd className="rounded border px-1.5 py-0.5">Shift</kbd> +{" "}
                <kbd className="rounded border px-1.5 py-0.5">O</kbd>.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-sm font-medium text-foreground">Supabase-backed model</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Users, departments, and department access are modeled in SQL and ready for expansion.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/75">
          <CardHeader>
            <CardTitle>Current lane</CardTitle>
            <CardDescription>Signed in as {session.user.department.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-dashed border-border/80 bg-background/75 p-4">
              <p className="text-sm font-medium">Next pieces to add</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Order detail rules, department-specific task queues, and the actual scanner destination logic can
                now be layered in without reworking auth or navigation.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-sm text-muted-foreground">Active route prefix</p>
              <p className="mt-1 font-mono text-sm text-foreground">/departments/{departmentSlug}/...</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
