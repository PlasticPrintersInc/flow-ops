import { redirect } from "next/navigation";

import { AppSetupPanel } from "@/components/setup/app-setup-panel";
import { Badge } from "@/components/ui/badge";
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
              Ask an admin to add at least one record in <code>public.user_departments</code> for this
              user, then sign in again with the department you want to work in.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
              You are signed in to {session.user.department.name}. Dashboard work queues will appear here as they
              become active for launch.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border-border/70 bg-card/75">
          <CardHeader>
            <CardTitle>Launch-ready capabilities</CardTitle>
            <CardDescription>Current live surfaces for this department.</CardDescription>
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
              <p className="text-sm font-medium text-foreground">Scan routing</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Recognized labels route to the active department without exposing preview-only dashboard links.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-sm font-medium text-foreground">Department access</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Users only land in routes for the department selected during sign-in.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/75">
          <CardHeader>
            <CardTitle>Current station</CardTitle>
            <CardDescription>Signed in as {session.user.department.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-sm text-muted-foreground">Active department</p>
              <p className="mt-1 text-lg font-medium text-foreground">{session.user.department.name}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
              <p className="text-sm text-muted-foreground">Signed-in user</p>
              <p className="mt-1 text-lg font-medium text-foreground">{session.user.displayName}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
