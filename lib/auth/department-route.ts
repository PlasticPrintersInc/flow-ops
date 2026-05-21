import { redirect } from "next/navigation";

import { requireAuthenticatedSessionContext } from "@/lib/auth/session";
import type { ActiveAppUser, DepartmentSummary } from "@/lib/types";

export type DepartmentRouteUser = ActiveAppUser & {
  department: DepartmentSummary;
};

export type DepartmentRouteSession = {
  isConfigured: true;
  user: DepartmentRouteUser;
};

export async function requireDepartmentRouteSession(
  departmentSlug: string,
  buildActiveDepartmentPath: (departmentSlug: string) => string,
): Promise<DepartmentRouteSession> {
  const session = await requireAuthenticatedSessionContext();

  if (!session.isConfigured) {
    redirect("/");
  }

  if (!session.user?.department) {
    redirect("/");
  }

  if (departmentSlug !== session.user.department.slug) {
    redirect(buildActiveDepartmentPath(session.user.department.slug));
  }

  return {
    isConfigured: true,
    user: {
      ...session.user,
      department: session.user.department,
    },
  };
}
