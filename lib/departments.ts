import type { DepartmentSummary } from "@/lib/types";

const ADMIN_DEPARTMENT_SLUG = "admin";
const SHIPPING_DEPARTMENT_SLUGS = new Set(["shipping", "vp-shipping"]);

export function isAdminDepartment(department: Pick<DepartmentSummary, "slug"> | null | undefined) {
  return department?.slug === ADMIN_DEPARTMENT_SLUG;
}

export function isShippingDepartment(department: Pick<DepartmentSummary, "slug">) {
  return SHIPPING_DEPARTMENT_SLUGS.has(department.slug);
}
