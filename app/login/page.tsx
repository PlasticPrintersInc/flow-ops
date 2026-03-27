import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRecentLoginIds } from "@/lib/auth/cookies";
import { getSessionContext } from "@/lib/auth/session";
import { getLoginDirectory } from "@/lib/data/login-directory";
import { sanitizeInternalRedirect } from "@/lib/navigation";

type LoginPageProps = {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, directory, recentUserIds, resolvedSearchParams] = await Promise.all([
    getSessionContext(),
    getLoginDirectory(),
    getRecentLoginIds(),
    searchParams,
  ]);
  const redirectTo = sanitizeInternalRedirect(resolvedSearchParams.redirectTo);

  if (session.isConfigured && session.user) {
    redirect(redirectTo);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        {!directory.isConfigured || directory.users.length === 0 ? (
          <Card className="border-border/70 bg-card/85 shadow-[0_24px_90px_-44px_rgba(15,23,42,0.5)] backdrop-blur">
            <CardHeader>
              <CardTitle className="text-3xl">Sign-in unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                Please contact your administrator if you need help accessing the system.
              </p>
            </CardContent>
          </Card>
        ) : (
          <LoginForm recentUserIds={recentUserIds} redirectTo={redirectTo} users={directory.users} />
        )}
      </div>
    </div>
  );
}
