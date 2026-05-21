import { redirect } from "next/navigation";

import { decodeQuickstartPin } from "@/lib/auth/quickstart-codec";
import { signInWithPin, signOutCurrentSession } from "@/lib/auth/login";
import {
  getQuickstartDefaultDepartment,
  getQuickstartUser,
} from "@/lib/data/quickstart-users";

type QuickstartRouteContext = {
  params: Promise<{
    pinToken: string;
    userId: string;
  }>;
};

function getChoosePath(userId: string, pinToken: string, error?: string) {
  const basePath = `/quickstart/${encodeURIComponent(userId)}/${encodeURIComponent(pinToken)}/choose`;

  return error ? `${basePath}?error=${encodeURIComponent(error)}` : basePath;
}

export async function GET(_request: Request, { params }: QuickstartRouteContext) {
  const { pinToken, userId } = await params;

  await signOutCurrentSession();

  let pin = "";

  try {
    pin = decodeQuickstartPin(userId, pinToken);
  } catch {
    redirect(getChoosePath(userId, pinToken, "invalid-link"));
  }

  const quickstartUser = await getQuickstartUser(userId);
  const user = quickstartUser.user;

  if (!quickstartUser.isConfigured || !user || user.departments.length !== 1) {
    redirect(getChoosePath(userId, pinToken));
  }

  const department = getQuickstartDefaultDepartment(user);

  if (!department) {
    redirect(getChoosePath(userId, pinToken));
  }

  const signInResult = await signInWithPin({
    departmentId: department.id,
    pin,
    userId,
  });

  if (!signInResult.ok) {
    redirect(getChoosePath(userId, pinToken, "pin"));
  }

  redirect("/");
}
