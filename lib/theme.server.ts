import { cookies } from "next/headers";

import { THEME_COOKIE_NAME, type ThemeMode } from "@/lib/theme";

export async function getServerTheme(): Promise<ThemeMode> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(THEME_COOKIE_NAME)?.value;

  return cookieValue === "dark" ? "dark" : "light";
}
