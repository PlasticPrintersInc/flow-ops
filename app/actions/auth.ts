"use server";

import { redirect } from "next/navigation";

import { type LoginActionState, loginFormSchema } from "@/lib/auth/forms";
import { signInWithPin, signOutCurrentSession } from "@/lib/auth/login";
import { sanitizeInternalRedirect } from "@/lib/navigation";

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

  const { userId, departmentId, pin } = validatedFields.data;
  const redirectToEntry = formData.get("redirectTo");
  const redirectTo = sanitizeInternalRedirect(
    typeof redirectToEntry === "string" ? redirectToEntry : null,
  );

  const result = await signInWithPin({ departmentId, pin, userId });

  if (!result.ok) {
    return {
      message: result.message,
    };
  }

  redirect(redirectTo);
}

export async function logoutAction() {
  await signOutCurrentSession();
  redirect("/login");
}
