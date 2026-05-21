import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PpOrderDetail } from "@/components/production/pp-order-detail";
import { ProductionErrorCard } from "@/components/production/production-error-card";
import { requireDepartmentRouteSession } from "@/lib/auth/department-route";
import { getProofingProductionOrder } from "@/lib/data/proofing-orders";
import { getQualityControlFlowRedirectUrl } from "@/lib/data/quality-control-flow";
import { getShippingOrderRedirectUrl } from "@/lib/data/shipping-orders";
import { buildDepartmentDestination } from "@/lib/department-routes";
import { isShippingDepartment } from "@/lib/departments";
import { getRequestOrigin } from "@/lib/request";

type OrderRouteProps = {
  params: Promise<{
    departmentSlug: string;
    orderId: string;
  }>;
};

function LookupErrorState({
  title,
  description,
  message,
}: {
  title: string;
  description: string;
  message: string;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
      <ProductionErrorCard title={title} description={description} message={message} />
    </div>
  );
}

export default async function OrderPage({ params }: OrderRouteProps) {
  const { departmentSlug, orderId } = await params;
  const [session, requestHeaders] = await Promise.all([
    requireDepartmentRouteSession(departmentSlug, (activeDepartmentSlug) =>
      buildDepartmentDestination(activeDepartmentSlug, "pporders", orderId),
    ),
    headers(),
  ]);
  const requestOrigin = getRequestOrigin(requestHeaders);
  const { department } = session.user;

  if (department.slug === "quality-control") {
    const qualityControlLookup = await getQualityControlFlowRedirectUrl(orderId);

    if (qualityControlLookup.ok) {
      redirect(qualityControlLookup.redirectUrl);
    }

    return (
      <LookupErrorState
        title="Quality control flow unavailable"
        description={
          qualityControlLookup.status
            ? `Airtable status ${qualityControlLookup.status}`
            : "Airtable configuration or lookup issue"
        }
        message={qualityControlLookup.message}
      />
    );
  }

  if (isShippingDepartment(department)) {
    const shippingLookup = await getShippingOrderRedirectUrl(orderId, requestOrigin);

    if (shippingLookup.ok) {
      redirect(shippingLookup.redirectUrl);
    }

    return (
      <LookupErrorState
        title="Shipping order unavailable"
        description="Supabase jobs lookup issue"
        message={shippingLookup.message}
      />
    );
  }

  const loadResult = await getProofingProductionOrder(orderId, requestOrigin);

  return (
    <PpOrderDetail
      departmentName={department.name}
      departmentSlug={department.slug}
      displayName={session.user.displayName}
      loadResult={loadResult}
      orderId={orderId}
    />
  );
}
