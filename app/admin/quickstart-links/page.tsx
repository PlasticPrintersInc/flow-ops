import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { QuickstartLinkBuilder } from "@/components/admin/quickstart-link-builder";
import { AppSetupPanel } from "@/components/setup/app-setup-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuthenticatedSessionContext } from "@/lib/auth/session";
import { getLoginDirectory } from "@/lib/data/login-directory";
import { isAdminDepartment } from "@/lib/departments";

function getBaseUrl(headersList: Headers) {
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "";
}

export default async function AdminQuickstartLinksPage() {
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

  if (!isAdminDepartment(session.user.department)) {
    redirect("/");
  }

  const [directory, headersList] = await Promise.all([getLoginDirectory(), headers()]);

  if (!directory.isConfigured || directory.users.length === 0) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 sm:px-6">
        <Card className="w-full border-border/70 bg-card/85 shadow-[0_24px_90px_-44px_rgba(15,23,42,0.5)] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl">Quickstart links unavailable</CardTitle>
            <CardDescription className="text-base leading-7">
              No active sign-in users are available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              Add active users and department memberships before generating badge URLs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Quickstart badge links
        </h1>
        <p className="text-base leading-7 text-muted-foreground">
          Generate a QR-ready URL for a production member.
        </p>
      </div>

      <QuickstartLinkBuilder baseUrl={getBaseUrl(headersList)} users={directory.users} />
    </div>
  );
}
