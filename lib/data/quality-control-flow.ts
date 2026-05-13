const QUALITY_CONTROL_AIRTABLE_BASE_ID = "appEYICbhSqtUVYoj";
const QUALITY_CONTROL_AIRTABLE_TABLE_ID = "tblApIt6r8ad9FPB3";
const QUALITY_CONTROL_JOB_ID_FIELD_ID = "fldO6WW0gm2LXPH4z";
const QUALITY_CONTROL_FLOW_ID_FIELD_ID = "fld8fkJQYFv9TE2bZ";
const QUALITY_CONTROL_FORM_URL = "https://form.plasticprinters.com/t/t8WntQ9Q2zus";

type AirtableRecord = {
  id: string;
  fields?: Record<string, unknown>;
};

type AirtableListRecordsResponse = {
  records?: AirtableRecord[];
};

export type QualityControlFlowLookupResult =
  | {
      ok: true;
      redirectUrl: string;
    }
  | {
      ok: false;
      message: string;
      status?: number;
    };

class QualityControlFlowLookupError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "QualityControlFlowLookupError";
    this.status = status;
  }
}

function getAirtableToken() {
  return (
    process.env.QUALITY_CONTROL_AIRTABLE_TOKEN?.trim() ||
    process.env.AIRTABLE_API_TOKEN?.trim() ||
    process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN?.trim()
  );
}

function buildAirtableUrl(pathname: string, params?: Record<string, string>) {
  const url = new URL(pathname, "https://api.airtable.com");

  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url;
}

async function airtableGet<TResponse>(pathname: string, params?: Record<string, string>) {
  const token = getAirtableToken();

  if (!token) {
    throw new QualityControlFlowLookupError(
      "QUALITY_CONTROL_AIRTABLE_TOKEN or AIRTABLE_API_TOKEN is not configured.",
    );
  }

  const response = await fetch(buildAirtableUrl(pathname, params), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new QualityControlFlowLookupError("Airtable request failed.", response.status);
  }

  return (await response.json()) as TResponse;
}

function escapeAirtableString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function buildJobIdFormula(fieldReference: string, orderId: string) {
  return `{${fieldReference}} = "${escapeAirtableString(orderId)}"`;
}

function primitiveFieldValueToString(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value) && value.length === 1) {
    return primitiveFieldValueToString(value[0]);
  }

  return null;
}

function buildQualityControlFormUrl(record: AirtableRecord, orderId: string) {
  const flowId = primitiveFieldValueToString(record.fields?.[QUALITY_CONTROL_FLOW_ID_FIELD_ID]);

  if (!flowId) {
    throw new QualityControlFlowLookupError("Airtable record did not include a FlowID.");
  }

  const url = new URL(QUALITY_CONTROL_FORM_URL);
  url.searchParams.set("id", record.id);
  url.searchParams.set("JobNumber", orderId);
  url.searchParams.set("FlowID", flowId);

  return url.toString();
}

async function getQualityControlFlowRecord(filterByFormula: string) {
  const response = await airtableGet<AirtableListRecordsResponse>(
    `/v0/${QUALITY_CONTROL_AIRTABLE_BASE_ID}/${QUALITY_CONTROL_AIRTABLE_TABLE_ID}`,
    {
      filterByFormula,
      maxRecords: "1",
      returnFieldsByFieldId: "true",
    },
  );

  return response.records?.[0] ?? null;
}

export async function getQualityControlFlowRedirectUrl(
  orderId: string,
): Promise<QualityControlFlowLookupResult> {
  try {
    const record = await getQualityControlFlowRecord(
      buildJobIdFormula(QUALITY_CONTROL_JOB_ID_FIELD_ID, orderId),
    );

    if (!record) {
      return {
        ok: false,
        message: `No quality control flow record was found for PP order ${orderId}.`,
      };
    }

    return {
      ok: true,
      redirectUrl: buildQualityControlFormUrl(record, orderId),
    };
  } catch (error) {
    if (error instanceof QualityControlFlowLookupError) {
      return {
        ok: false,
        message: error.message,
        status: error.status,
      };
    }

    return {
      ok: false,
      message: "Unable to load the quality control flow record.",
    };
  }
}
