export function sanitizeInternalRedirect(redirectTo?: string | null) {
  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return "/";
  }

  return redirectTo;
}
