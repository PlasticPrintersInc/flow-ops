import { cookies } from "next/headers";

const ACTIVE_DEPARTMENT_COOKIE = "flow_active_department";
const RECENT_LOGINS_COOKIE = "flow_recent_logins";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function parseRecentLoginCookie(value: string | undefined) {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

export async function getActiveDepartmentId() {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_DEPARTMENT_COOKIE)?.value ?? null;
}

export async function setActiveDepartmentCookie(departmentId: string) {
  const cookieStore = await cookies();

  cookieStore.set(ACTIVE_DEPARTMENT_COOKIE, departmentId, {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearActiveDepartmentCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_DEPARTMENT_COOKIE);
}

export async function getRecentLoginIds() {
  const cookieStore = await cookies();
  return parseRecentLoginCookie(cookieStore.get(RECENT_LOGINS_COOKIE)?.value);
}

export async function prependRecentLogin(userId: string) {
  const cookieStore = await cookies();
  const existingLogins = parseRecentLoginCookie(cookieStore.get(RECENT_LOGINS_COOKIE)?.value);
  const nextRecentLogins = [userId, ...existingLogins.filter((entry) => entry !== userId)].slice(0, 5);

  cookieStore.set(RECENT_LOGINS_COOKIE, JSON.stringify(nextRecentLogins), {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
