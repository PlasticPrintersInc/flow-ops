import type { DepartmentSummary } from "@/lib/types";

const SHIPPING_DEPARTMENT_SLUGS = new Set(["shipping", "vp-shipping"]);

export function isShippingDepartment(department: Pick<DepartmentSummary, "slug">) {
  return SHIPPING_DEPARTMENT_SLUGS.has(department.slug);
}
