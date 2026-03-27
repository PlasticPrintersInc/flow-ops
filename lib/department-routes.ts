export const ROUTED_RESOURCE_TYPES = ["pporders", "vporders", "inventory"] as const;

export type RoutedResourceType = (typeof ROUTED_RESOURCE_TYPES)[number];

export function isRoutedResourceType(value: string): value is RoutedResourceType {
  return ROUTED_RESOURCE_TYPES.includes(value as RoutedResourceType);
}

export function buildDepartmentDestination(
  departmentSlug: string,
  resourceType: RoutedResourceType,
  resourceId: string,
) {
  return `/departments/${departmentSlug}/${resourceType}/${encodeURIComponent(resourceId)}`;
}
