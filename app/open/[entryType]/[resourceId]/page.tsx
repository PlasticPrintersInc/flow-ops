import { notFound, redirect } from "next/navigation";

import { buildDepartmentDestination, isRoutedResourceType } from "@/lib/department-routes";
import { getSessionContext } from "@/lib/auth/session";

type ExternalOpenPageProps = {
  params: Promise<{
    entryType: string;
    resourceId: string;
  }>;
};

export default async function ExternalOpenPage({ params }: ExternalOpenPageProps) {
  const [{ entryType, resourceId }, session] = await Promise.all([params, getSessionContext()]);

  if (!isRoutedResourceType(entryType)) {
    notFound();
  }

  const externalEntryPath = `/open/${encodeURIComponent(entryType)}/${encodeURIComponent(resourceId)}`;

  if (!session.isConfigured) {
    redirect("/login");
  }

  if (!session.user) {
    redirect(`/login?redirectTo=${encodeURIComponent(externalEntryPath)}`);
  }

  if (!session.user.department) {
    redirect("/");
  }

  redirect(buildDepartmentDestination(session.user.department.slug, entryType, resourceId));
}
