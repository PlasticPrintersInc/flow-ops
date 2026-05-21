import { QuickstartLoginForm } from "@/components/auth/quickstart-login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { decodeQuickstartPin } from "@/lib/auth/quickstart-codec";
import {
  getQuickstartDefaultDepartment,
  getQuickstartUser,
} from "@/lib/data/quickstart-users";
import { sanitizeInternalRedirect } from "@/lib/navigation";

type QuickstartChoosePageProps = {
  params: Promise<{
    pinToken: string;
    userId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
};

function getErrorMessage(error?: string) {
  if (error === "pin") {
    return "The PIN on this quickstart link was not accepted.";
  }

  if (error === "invalid-link") {
    return "This quickstart link is not valid.";
  }

  return undefined;
}

function QuickstartUnavailableCard({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Card className="border-border/70 bg-card/85 shadow-[0_24px_90px_-44px_rgba(15,23,42,0.5)] backdrop-blur">
      <CardHeader>
        <CardTitle className="text-3xl">{title}</CardTitle>
        <CardDescription className="text-base leading-7">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          Use the regular sign-in screen or ask an admin to generate a new badge link.
        </p>
      </CardContent>
    </Card>
  );
}

export default async function QuickstartChoosePage({
  params,
  searchParams,
}: QuickstartChoosePageProps) {
  const [{ pinToken, userId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const redirectTo = sanitizeInternalRedirect(resolvedSearchParams.redirectTo);
  const initialMessage = getErrorMessage(resolvedSearchParams.error);

  let pin = "";

  try {
    pin = decodeQuickstartPin(userId, pinToken);
  } catch {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <QuickstartUnavailableCard
            description="The badge link could not be read."
            title="Quick sign-in unavailable"
          />
        </div>
      </div>
    );
  }

  const quickstartUser = await getQuickstartUser(userId);

  if (!quickstartUser.isConfigured) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <QuickstartUnavailableCard
            description="Supabase is not fully configured yet."
            title="Sign-in unavailable"
          />
        </div>
      </div>
    );
  }

  if (!quickstartUser.user) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <QuickstartUnavailableCard
            description="This badge link does not match an active user."
            title="Quick sign-in unavailable"
          />
        </div>
      </div>
    );
  }

  const defaultDepartment = getQuickstartDefaultDepartment(quickstartUser.user);

  if (!defaultDepartment) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl">
          <QuickstartUnavailableCard
            description="This user does not have department access configured."
            title="Department access needed"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        <QuickstartLoginForm
          initialDepartmentId={defaultDepartment.id}
          initialMessage={initialMessage}
          pin={pin}
          redirectTo={redirectTo}
          user={quickstartUser.user}
        />
      </div>
    </div>
  );
}
