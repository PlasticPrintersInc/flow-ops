import { cache } from "react";
import { redirect } from "next/navigation";

import { getActiveDepartmentId } from "@/lib/auth/cookies";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createSupabaseServerClient, hasSupabaseClientEnv } from "@/lib/supabase/server";
import type { ActiveAppUser, AppSessionContext, DepartmentSummary } from "@/lib/types";

type JoinedDepartment = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type SessionLookupRow = {
  id: string;
  display_name: string;
  is_active: boolean;
  user_departments:
    | Array<{
        department_id: string;
        departments: JoinedDepartment | JoinedDepartment[] | null;
      }>
    | null;
};

function normalizeJoinedDepartments(departments: JoinedDepartment | JoinedDepartment[] | null) {
  if (!departments) {
    return [];
  }

  return Array.isArray(departments) ? departments : [departments];
}

function getDepartmentChoices(row: SessionLookupRow | null): DepartmentSummary[] {
  if (!row?.user_departments) {
    return [];
  }

  return row.user_departments
    .flatMap((membership) => normalizeJoinedDepartments(membership.departments))
    .filter((department): department is NonNullable<typeof department> => {
      return department !== null && department.is_active;
    })
    .map((department) => ({
      id: department.id,
      name: department.name,
      slug: department.slug,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export const getSessionContext = cache(async (): Promise<AppSessionContext> => {
  if (!hasSupabaseClientEnv() || !hasSupabaseAdminEnv()) {
    return {
      isConfigured: false,
      user: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return {
      isConfigured: true,
      user: null,
    };
  }

  const adminClient = createSupabaseAdminClient();
  const { data } = await adminClient
    .from("users")
    .select(
      `
        id,
        display_name,
        is_active,
        user_departments (
          department_id,
          departments (
            id,
            name,
            slug,
            is_active
          )
        )
      `,
    )
    .eq("id", authUser.id)
    .eq("is_active", true)
    .single<SessionLookupRow>();

  if (!data) {
    return {
      isConfigured: true,
      user: null,
    };
  }

  const activeDepartmentId = await getActiveDepartmentId();
  const departments = getDepartmentChoices(data);
  const activeDepartment =
    departments.find((department) => department.id === activeDepartmentId) ?? departments[0] ?? null;

  const appUser: ActiveAppUser = {
    id: data.id,
    displayName: data.display_name,
    department: activeDepartment,
    departments,
  };

  return {
    isConfigured: true,
    user: appUser,
  };
});

export async function requireAuthenticatedSessionContext() {
  const session = await getSessionContext();

  if (!session.isConfigured) {
    return session;
  }

  if (!session.user) {
    redirect("/login");
  }

  return session;
}
