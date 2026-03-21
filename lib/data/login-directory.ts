import { cache } from "react";

import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import type { LoginDirectoryUser } from "@/lib/types";

type JoinedDepartment = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type LoginDirectoryRow = {
  id: string;
  display_name: string;
  is_active: boolean;
  user_departments:
    | Array<{
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

export const getLoginDirectory = cache(async () => {
  if (!hasSupabaseAdminEnv()) {
    return {
      isConfigured: false,
      users: [] as LoginDirectoryUser[],
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
          departments (
            id,
            name,
            slug,
            is_active
          )
        )
      `,
    )
    .eq("is_active", true)
    .order("display_name");

  const users = ((data ?? []) as unknown as LoginDirectoryRow[])
    .map((row) => ({
      id: row.id,
      displayName: row.display_name,
      departments: (row.user_departments ?? [])
        .flatMap((membership) => normalizeJoinedDepartments(membership.departments))
        .filter((department): department is NonNullable<typeof department> => {
          return department !== null && department.is_active;
        })
        .map((department) => ({
          id: department.id,
          name: department.name,
          slug: department.slug,
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .sort((left, right) => left.displayName.localeCompare(right.displayName));

  return {
    isConfigured: true,
    users,
  };
});
