import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import type { DepartmentSummary } from "@/lib/types";

type JoinedDepartment = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type QuickstartUserRow = {
  id: string;
  display_name: string;
  default_department_id: string | null;
  is_active: boolean;
  user_departments:
    | Array<{
        departments: JoinedDepartment | JoinedDepartment[] | null;
      }>
    | null;
};

export type QuickstartUser = {
  id: string;
  displayName: string;
  defaultDepartmentId: string | null;
  departments: DepartmentSummary[];
};

function normalizeJoinedDepartments(departments: JoinedDepartment | JoinedDepartment[] | null) {
  if (!departments) {
    return [];
  }

  return Array.isArray(departments) ? departments : [departments];
}

export function getQuickstartDefaultDepartment(user: QuickstartUser) {
  return (
    user.departments.find((department) => department.id === user.defaultDepartmentId) ??
    user.departments[0] ??
    null
  );
}

export async function getQuickstartUser(userId: string) {
  if (!hasSupabaseAdminEnv()) {
    return {
      isConfigured: false,
      user: null as QuickstartUser | null,
    };
  }

  const adminClient = createSupabaseAdminClient();
  const { data } = await adminClient
    .from("users")
    .select(
      `
        id,
        display_name,
        default_department_id,
        is_active,
        user_departments (
          departments (
            id,
            name,
            slug,
            is_active
          )
        )
      `,
    )
    .eq("id", userId)
    .eq("is_active", true)
    .single<QuickstartUserRow>();

  if (!data) {
    return {
      isConfigured: true,
      user: null,
    };
  }

  const departments = (data.user_departments ?? [])
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

  return {
    isConfigured: true,
    user: {
      id: data.id,
      displayName: data.display_name,
      defaultDepartmentId: data.default_department_id,
      departments,
    },
  };
}
