const SHIPSTATION_SEARCH_URL = "https://ship7.shipstation.com/orders/all-orders-search-result";

type ShippingJobRow = {
  order_number: string | number | null;
};

type ShippingJobApiEnvelope =
  | {
      records?: Array<{
        data?: ShippingJobRow | null;
      }>;
    }
  | null;

export type ShippingOrderLookupResult =
  | {
      ok: true;
      redirectUrl: string;
    }
  | {
      ok: false;
      message: string;
    };

class ShippingOrderLookupError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ShippingOrderLookupError";
    this.status = status;
  }
}

function getApiToken() {
  return process.env.PROOFING_JOBS_API_TOKEN?.trim();
}

function getApiBaseUrl(requestOrigin?: string) {
  const configuredBaseUrl = process.env.PROOFING_JOBS_API_BASE_URL?.trim();

  return configuredBaseUrl || requestOrigin;
}

function buildApiUrl(baseUrl: string, pathname: string, params: Record<string, string>) {
  const url = new URL(pathname, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url;
}

function buildShipStationSearchUrl(orderNumber: string) {
  const url = new URL(SHIPSTATION_SEARCH_URL);
  url.searchParams.set("quickSearch", orderNumber);

  return url.toString();
}

function normalizeOrderNumber(orderNumber: ShippingJobRow["order_number"]) {
  if (typeof orderNumber === "string") {
    return orderNumber.trim();
  }

  if (typeof orderNumber === "number") {
    return String(orderNumber);
  }

  return "";
}

async function getShippingJob(jobId: string, requestOrigin?: string) {
  const token = getApiToken();
  const baseUrl = getApiBaseUrl(requestOrigin);

  if (!token) {
    throw new ShippingOrderLookupError("PROOFING_JOBS_API_TOKEN is not configured.");
  }

  if (!baseUrl) {
    throw new ShippingOrderLookupError(
      "PROOFING_JOBS_API_BASE_URL is not configured and the request origin could not be detected.",
    );
  }

  const response = await fetch(
    buildApiUrl(baseUrl, "/api/supabase/jobs/get", { orderId: jobId }),
    {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new ShippingOrderLookupError("Shipping jobs API request failed.", response.status);
  }

  const envelope = (await response.json()) as ShippingJobApiEnvelope;

  const record = envelope?.records?.[0]?.data;

  if (!record) {
    throw new ShippingOrderLookupError(`Shipping jobs API did not return a record for ${jobId}.`);
  }

  return record;
}

export async function getShippingOrderRedirectUrl(
  jobId: string,
  requestOrigin?: string,
): Promise<ShippingOrderLookupResult> {
  try {
    const job = await getShippingJob(jobId, requestOrigin);
    const orderNumber = normalizeOrderNumber(job.order_number);

    if (!orderNumber) {
      return {
        ok: false,
        message: `No shipping order number was found for PP order ${jobId}.`,
      };
    }

    return {
      ok: true,
      redirectUrl: buildShipStationSearchUrl(orderNumber),
    };
  } catch (error) {
    if (error instanceof ShippingOrderLookupError) {
      return {
        ok: false,
        message: error.message,
      };
    }

    return {
      ok: false,
      message: "Unable to load the shipping order number.",
    };
  }
}
