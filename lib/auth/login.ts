import {
  clearActiveDepartmentCookie,
  prependRecentLogin,
  setActiveDepartmentCookie,
} from "@/lib/auth/cookies";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";
import { createSupabaseServerClient, hasSupabaseClientEnv } from "@/lib/supabase/server";

type JoinedDepartment = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type LoginLookupRow = {
  id: string;
  email: string;
  display_name: string;
  is_active: boolean;
  user_departments:
    | Array<{
        department_id: string;
        departments: JoinedDepartment | JoinedDepartment[] | null;
      }>
    | null;
};

type SignInWithPinInput = {
  departmentId: string;
  pin: string;
  userId: string;
};

type SignInWithPinResult =
  | {
      ok: true;
    }
  | {
      message: string;
      ok: false;
    };

function normalizeJoinedDepartments(departments: JoinedDepartment | JoinedDepartment[] | null) {
  if (!departments) {
    return [];
  }

  return Array.isArray(departments) ? departments : [departments];
}

export async function signInWithPin({
  departmentId,
  pin,
  userId,
}: SignInWithPinInput): Promise<SignInWithPinResult> {
  if (!hasSupabaseClientEnv() || !hasSupabaseAdminEnv()) {
    return {
      message: "Supabase is not fully configured yet. Add the app environment variables first.",
      ok: false,
    };
  }

  const adminClient = createSupabaseAdminClient();

  const { data, error } = await adminClient
    .from("users")
    .select(
      `
        id,
        email,
        display_name,
        is_active,
        user_departments!inner (
          department_id,
          departments!inner (
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
    .eq("user_departments.department_id", departmentId)
    .single<LoginLookupRow>();

  if (error || !data) {
    return {
      message: "That sign-in combination is not allowed for this user.",
      ok: false,
    };
  }

  const department =
    data.user_departments
      ?.flatMap((membership) => normalizeJoinedDepartments(membership.departments))
      .find((joinedDepartment) => joinedDepartment.id === departmentId) ?? null;

  if (!department || !department.is_active) {
    return {
      message: "The selected department is not currently available for sign-in.",
      ok: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: pin,
  });

  if (signInError) {
    return {
      message: "The PIN was not accepted. Please try again.",
      ok: false,
    };
  }

  await setActiveDepartmentCookie(department.id);
  await prependRecentLogin(data.id);

  return {
    ok: true,
  };
}

export async function signOutCurrentSession() {
  if (hasSupabaseClientEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  await clearActiveDepartmentCookie();
}
