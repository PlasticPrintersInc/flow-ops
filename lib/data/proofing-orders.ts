export type ProofingStatus = {
  id?: string;
  name: string;
  color?: string;
};

export type AirtableLinkedRecord = {
  id: string;
  name?: string;
};

export type ProofingJobRecord = {
  airtable_record_id?: string;
  status?: ProofingStatus | null;
  items?: AirtableLinkedRecord[] | null;
  designsid?: string | null;
  ordersid?: string | null;
  designs?: AirtableLinkedRecord[] | null;
  proofs?: AirtableLinkedRecord[] | null;
  designs_status?: {
    linkedRecordIds?: string[];
    valuesByLinkedRecordId?: Record<string, ProofingStatus[]>;
  } | null;
};

export type ProofingItemRecord = {
  id: string;
  itemid?: string | null;
  designs?: AirtableLinkedRecord[] | null;
  archived?: boolean | null;
  orderitemid?: string | null;
};

export type ProofingDesignRecord = {
  id: string;
  status?: ProofingStatus | null;
  design_name?: string | null;
  proofs?: AirtableLinkedRecord[] | null;
};

export type ProofingProofRecord = {
  id: string;
  status?: ProofingStatus | null;
  approval_timestamp?: string | null;
  proof_name?: string | null;
  proof_link?: string | null;
};

export type WorkOrderAttachment = {
  id?: string;
  url?: string;
  size?: number;
  type?: string;
  filename?: string;
  thumbnails?: {
    large?: {
      url?: string;
      width?: number;
      height?: number;
    };
    small?: {
      url?: string;
      width?: number;
      height?: number;
    };
  };
};

export type OrderItemRecord = {
  id: string;
  work_order?: WorkOrderAttachment[] | null;
};

export type ProofingDesignWithProofs = {
  design: ProofingDesignRecord;
  proofs: ProofingProofRecord[];
  approvedProof: ProofingProofRecord | null;
};

export type ProofingOrderItem = {
  item: ProofingItemRecord;
  orderItem: OrderItemRecord | null;
  designs: ProofingDesignWithProofs[];
};

export type ProofingProductionOrder = {
  jobId: string;
  job: ProofingJobRecord;
  items: ProofingOrderItem[];
  unassignedDesigns: ProofingDesignWithProofs[];
};

export type ProofingOrderLoadResult =
  | {
      ok: true;
      order: ProofingProductionOrder;
    }
  | {
      ok: false;
      message: string;
      status?: number;
    };

type ApiEnvelope<TRecord> =
  | {
      record?: TRecord;
      records?: Array<TRecord | { id?: string; data?: TRecord }>;
    }
  | null;

class ProofingJobsApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ProofingJobsApiError";
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

function uniqueValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function linkedRecordIds(records: Array<AirtableLinkedRecord> | null | undefined) {
  return uniqueValues((records ?? []).map((record) => record.id));
}

function buildUrl(baseUrl: string, pathname: string, params: Record<string, string>) {
  const url = new URL(pathname, baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url;
}

async function proofingJobsApiGet<TRecord>(
  pathname: string,
  params: Record<string, string>,
  requestOrigin?: string,
) {
  const token = getApiToken();
  const baseUrl = getApiBaseUrl(requestOrigin);

  if (!token) {
    throw new ProofingJobsApiError("PROOFING_JOBS_API_TOKEN is not configured.");
  }

  if (!baseUrl) {
    throw new ProofingJobsApiError(
      "PROOFING_JOBS_API_BASE_URL is not configured and the request origin could not be detected.",
    );
  }

  const response = await fetch(buildUrl(baseUrl, pathname, params), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new ProofingJobsApiError(
      `Proofing jobs API request failed for ${pathname}.`,
      response.status,
    );
  }

  return (await response.json()) as ApiEnvelope<TRecord>;
}

async function getSingleRecord<TRecord>(
  pathname: string,
  params: Record<string, string>,
  requestOrigin?: string,
) {
  const envelope = await proofingJobsApiGet<TRecord>(pathname, params, requestOrigin);

  if (!envelope?.record) {
    throw new ProofingJobsApiError(`Proofing jobs API did not return a record for ${pathname}.`);
  }

  return envelope.record;
}

function normalizeRecords<TRecord extends object>(
  envelope: ApiEnvelope<TRecord>,
  requestedIds: string[],
) {
  if (!envelope) {
    return [];
  }

  if (envelope.records) {
    return envelope.records.map((record, index) => {
      if ("data" in record) {
        return {
          id: record.id ?? requestedIds[index] ?? "",
          data: {
            ...record.data,
            id: record.id ?? requestedIds[index] ?? "",
          } as TRecord & { id: string },
        };
      }

      const recordWithOptionalId = record as TRecord & { id?: string };
      const id = recordWithOptionalId.id ?? requestedIds[index] ?? "";

      return {
        id,
        data: {
          ...recordWithOptionalId,
          id,
        } as TRecord & { id: string },
      };
    });
  }

  if (envelope.record) {
    const id = requestedIds[0] ?? "";

    return [
      {
        id,
        data: {
          ...envelope.record,
          id,
        } as TRecord & { id: string },
      },
    ];
  }

  return [];
}

async function getRecords<TRecord extends object>(
  pathname: string,
  requestedIds: string[],
  requestOrigin?: string,
) {
  if (requestedIds.length === 0) {
    return [];
  }

  const envelope = await proofingJobsApiGet<TRecord>(
    pathname,
    { airtable_record_id: requestedIds.join(",") },
    requestOrigin,
  );

  return normalizeRecords<TRecord>(envelope, requestedIds);
}

function isApprovedProof(proof: ProofingProofRecord) {
  return proof.status?.name?.toLowerCase() === "approved";
}

function isCancelledDesign(design: ProofingDesignRecord) {
  const statusName = design.status?.name?.toLowerCase() ?? "";

  return statusName.includes("cancelled") || statusName.includes("canceled");
}

function isArchivedItem(item: ProofingItemRecord) {
  return Boolean(item.archived);
}

function compareItemsByName(left: ProofingItemRecord, right: ProofingItemRecord) {
  return (left.itemid ?? left.id).localeCompare(right.itemid ?? right.id, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function compareDesignsByName(left: ProofingDesignRecord, right: ProofingDesignRecord) {
  return (left.design_name ?? left.id).localeCompare(right.design_name ?? right.id, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export async function getProofingProductionOrder(
  jobId: string,
  requestOrigin?: string,
): Promise<ProofingOrderLoadResult> {
  try {
    const job = await getSingleRecord<ProofingJobRecord>(
      "/api/supabase/proofing/jobs/get",
      { jobid: jobId },
      requestOrigin,
    );

    const itemIds = linkedRecordIds(job.items);
    const items = await getRecords<Omit<ProofingItemRecord, "id">>(
      "/api/supabase/proofing/items/get",
      itemIds,
      requestOrigin,
    );
    const itemRecords = items
      .map(({ data }) => data)
      .filter((item) => !isArchivedItem(item))
      .sort(compareItemsByName);
    const itemDesignIds = itemRecords.flatMap((item) => linkedRecordIds(item.designs));
    const designIds = uniqueValues([...linkedRecordIds(job.designs), ...itemDesignIds]);

    const designs = await getRecords<Omit<ProofingDesignRecord, "id">>(
      "/api/supabase/proofing/designs/get",
      designIds,
      requestOrigin,
    );
    const designRecords = designs.map(({ data }) => data).filter((design) => !isCancelledDesign(design));
    const designProofIds = designRecords.flatMap((design) => linkedRecordIds(design.proofs));
    const proofIds = uniqueValues([...linkedRecordIds(job.proofs), ...designProofIds]);

    const [proofs, orderItems] = await Promise.all([
      getRecords<Omit<ProofingProofRecord, "id">>(
        "/api/supabase/proofing/proofs/get",
        proofIds,
        requestOrigin,
      ),
      getRecords<Omit<OrderItemRecord, "id">>(
        "/api/supabase/orderitems/get",
        uniqueValues(itemRecords.map((item) => item.orderitemid)),
        requestOrigin,
      ),
    ]);

    const designsById = new Map(designRecords.map((design) => [design.id, design]));
    const proofsById = new Map(proofs.map(({ data }) => [data.id, data]));
    const orderItemsById = new Map(orderItems.map(({ data }) => [data.id, data]));
    const assignedDesignIds = new Set(itemDesignIds);

    const hydrateDesign = (design: ProofingDesignRecord) => {
      const designProofs = linkedRecordIds(design.proofs)
        .map((proofId) => proofsById.get(proofId))
        .filter((proof): proof is ProofingProofRecord => Boolean(proof));

      return {
        design,
        proofs: designProofs,
        approvedProof: designProofs.find(isApprovedProof) ?? null,
      };
    };

    return {
      ok: true,
      order: {
        jobId,
        job,
        items: itemRecords.map((item) => ({
          item,
          orderItem: item.orderitemid ? orderItemsById.get(item.orderitemid) ?? null : null,
          designs: linkedRecordIds(item.designs)
            .map((designId) => designsById.get(designId))
            .filter((design): design is ProofingDesignRecord => Boolean(design))
            .sort(compareDesignsByName)
            .map(hydrateDesign),
        })),
        unassignedDesigns: designRecords
          .filter((design) => !assignedDesignIds.has(design.id))
          .sort(compareDesignsByName)
          .map(hydrateDesign),
      },
    };
  } catch (error) {
    if (error instanceof ProofingJobsApiError) {
      return {
        ok: false,
        message: error.message,
        status: error.status,
      };
    }

    return {
      ok: false,
      message: "Unable to load proofing order data.",
    };
  }
}
