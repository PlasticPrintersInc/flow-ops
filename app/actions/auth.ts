"use server";

import { redirect } from "next/navigation";

import {
  clearActiveDepartmentCookie,
  prependRecentLogin,
  setActiveDepartmentCookie,
} from "@/lib/auth/cookies";
import { type LoginActionState, loginFormSchema } from "@/lib/auth/forms";
import { sanitizeInternalRedirect } from "@/lib/navigation";
import { createSupabaseServerClient, hasSupabaseClientEnv } from "@/lib/supabase/server";
import { createSupabaseAdminClient, hasSupabaseAdminEnv } from "@/lib/supabase/admin";

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

function normalizeJoinedDepartments(departments: JoinedDepartment | JoinedDepartment[] | null) {
  if (!departments) {
    return [];
  }

  return Array.isArray(departments) ? departments : [departments];
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const validatedFields = loginFormSchema.safeParse({
    userId: formData.get("userId"),
    departmentId: formData.get("departmentId"),
    pin: formData.get("pin"),
  });

  if (!validatedFields.success) {
    const firstIssue = validatedFields.error.issues[0];

    return {
      message: firstIssue?.message ?? "Please complete the login form.",
    };
  }

  if (!hasSupabaseClientEnv() || !hasSupabaseAdminEnv()) {
    return {
      message: "Supabase is not fully configured yet. Add the app environment variables first.",
    };
  }

  const { userId, departmentId, pin } = validatedFields.data;
  const redirectTo = sanitizeInternalRedirect(
    typeof formData.get("redirectTo") === "string" ? formData.get("redirectTo") : null,
  );
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
    };
  }

  const department =
    data.user_departments
      ?.flatMap((membership) => normalizeJoinedDepartments(membership.departments))
      .find((joinedDepartment) => joinedDepartment.id === departmentId) ?? null;

  if (!department || !department.is_active) {
    return {
      message: "The selected department is not currently available for sign-in.",
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
    };
  }

  await setActiveDepartmentCookie(department.id);
  await prependRecentLogin(data.id);

  redirect(redirectTo);
}

export async function logoutAction() {
  if (hasSupabaseClientEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  await clearActiveDepartmentCookie();

  redirect("/login");
}
