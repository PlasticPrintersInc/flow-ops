function normalizeScanValue(scanValue: string) {
  return scanValue.trim();
}

function normalizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

export function resolveScanDestination(scanValue: string, departmentSlug?: string | null) {
  const normalizedValue = normalizeScanValue(scanValue);

  if (!normalizedValue || !departmentSlug) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    const normalizedHost = normalizeHost(parsedUrl.hostname);
    const [resourceType, resourceId] = parsedUrl.pathname.split("/").filter(Boolean);

    if (!resourceId) {
      return null;
    }

    if (normalizedHost === "spmd.ai" && resourceType === "o") {
      return `/departments/${departmentSlug}/orders/${encodeURIComponent(resourceId)}`;
    }

    if (normalizedHost === "spmd.ai" && resourceType === "i") {
      return `/departments/${departmentSlug}/inventory/${encodeURIComponent(resourceId)}`;
    }

    if (normalizedHost === "govp.app" && resourceType === "o") {
      return `/departments/${departmentSlug}/vporders/${encodeURIComponent(resourceId)}`;
    }
  } catch {
    return null;
  }

  return null;
}
