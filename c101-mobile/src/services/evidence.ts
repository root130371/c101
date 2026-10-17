import { supabase } from "../lib/supabase";

export type EvidenceStatus =
  | "available"
  | "failed"
  | "missing"
  | "processing"
  | "review_required"
  | "uploaded";

export type EvidenceType = "bank" | "contract" | "listing" | "message" | "photo";

export type EvidenceItem = {
  confidence: number | null;
  createdAt: string;
  extractedJson: Record<string, unknown>;
  fileName: string;
  filePath: string;
  fileType: string | null;
  id: string;
  status: EvidenceStatus;
  summaryEn: string | null;
  summaryTr: string | null;
  type: EvidenceType;
  updatedAt: string;
};

type EvidenceRow = {
  confidence: number | null;
  created_at: string;
  extracted_json: Record<string, unknown> | null;
  file_name: string;
  file_path: string;
  file_type: string | null;
  id: string;
  status: EvidenceStatus;
  summary_en: string | null;
  summary_tr: string | null;
  type: EvidenceType;
  updated_at: string;
};

export type EvidenceSummary = {
  availableCount: number;
  contractStatus: EvidenceStatus | "missing";
  latestSummary: string;
  reviewCount: number;
  totalCount: number;
};

export type EvidenceUploadInput = {
  fileName: string;
  mimeType: string | null;
  note?: string;
  size?: number | null;
  type: EvidenceType;
  uri: string;
};

export async function loadEvidenceItems(): Promise<EvidenceItem[]> {
  const { data, error } = await supabase
    .from("evidence_items")
    .select(
      "id,type,status,file_name,file_path,file_type,confidence,summary_tr,summary_en,extracted_json,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as EvidenceRow[]).map(mapEvidenceRow);
}

export async function uploadEvidence(input: EvidenceUploadInput): Promise<EvidenceItem> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    throw new Error(userError?.message || "Sign in before uploading evidence.");
  }

  const fileName = sanitizeFileName(input.fileName || "evidence-file");
  const filePath = `${user.id}/${Date.now()}-${fileName}`;
  const mimeType = input.mimeType || "application/octet-stream";
  const bytes = await readFileAsArrayBuffer(input.uri);

  const { error: uploadError } = await supabase.storage
    .from("evidence")
    .upload(filePath, bytes, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: evidenceData, error: evidenceError } = await supabase
    .from("evidence_items")
    .insert({
      file_bucket: "evidence",
      file_name: fileName,
      file_path: filePath,
      file_size: input.size || bytes.byteLength,
      file_type: mimeType,
      status: "uploaded",
      summary_en: cleanUploadNote(input.note),
      summary_tr: cleanUploadNote(input.note),
      type: input.type,
      user_id: user.id,
    })
    .select(
      "id,type,status,file_name,file_path,file_type,confidence,summary_tr,summary_en,extracted_json,created_at,updated_at",
    )
    .single();

  if (evidenceError || !evidenceData) {
    throw new Error(evidenceError?.message || "Evidence row was not created.");
  }

  const { error: jobError } = await supabase.from("extraction_jobs").insert({
    evidence_id: evidenceData.id,
    status: "queued",
    user_id: user.id,
  });

  if (jobError) {
    throw new Error(jobError.message);
  }

  void supabase.functions.invoke("analyze-evidence", {
    body: {
      evidence_id: evidenceData.id,
    },
  });

  return mapEvidenceRow(evidenceData as EvidenceRow);
}

function cleanUploadNote(note?: string) {
  const clean = note?.trim();
  return clean ? clean.slice(0, 500) : null;
}

export async function createEvidenceSignedUrl(item: EvidenceItem) {
  const { data, error } = await supabase.storage
    .from("evidence")
    .createSignedUrl(item.filePath, 60 * 10);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || "Could not create evidence preview link.");
  }

  return data.signedUrl;
}

export async function retryEvidenceAnalysis(item: EvidenceItem) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    throw new Error(userError?.message || "Sign in before retrying analysis.");
  }

  const { error: updateError } = await supabase
    .from("evidence_items")
    .update({
      status: "uploaded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: jobError } = await supabase.from("extraction_jobs").insert({
    evidence_id: item.id,
    status: "queued",
    user_id: user.id,
  });

  if (jobError) {
    throw new Error(jobError.message);
  }

  const { error: invokeError } = await supabase.functions.invoke("analyze-evidence", {
    body: {
      evidence_id: item.id,
    },
  });

  if (invokeError) {
    throw new Error(invokeError.message);
  }
}

export async function deleteEvidenceItem(item: EvidenceItem) {
  const { error: storageError } = await supabase.storage
    .from("evidence")
    .remove([item.filePath]);

  if (storageError) {
    throw new Error(storageError.message);
  }

  const { error: rowError } = await supabase
    .from("evidence_items")
    .delete()
    .eq("id", item.id);

  if (rowError) {
    throw new Error(rowError.message);
  }
}

export async function updateEvidenceItem(
  item: EvidenceItem,
  changes: {
    note?: string;
    type?: EvidenceType;
  },
): Promise<EvidenceItem> {
  const { data, error } = await supabase
    .from("evidence_items")
    .update({
      summary_en: changes.note === undefined ? undefined : cleanUploadNote(changes.note),
      summary_tr: changes.note === undefined ? undefined : cleanUploadNote(changes.note),
      type: changes.type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", item.id)
    .select(
      "id,type,status,file_name,file_path,file_type,confidence,summary_tr,summary_en,extracted_json,created_at,updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Evidence item was not updated.");
  }

  return mapEvidenceRow(data as EvidenceRow);
}

export function summarizeEvidence(items: EvidenceItem[]): EvidenceSummary {
  const contract = items.find((item) => item.type === "contract");
  const latestWithSummary = items.find((item) => evidenceSummaryText(item));

  return {
    availableCount: items.filter((item) => item.status === "available").length,
    contractStatus: contract?.status || "missing",
    latestSummary: latestWithSummary ? evidenceSummaryText(latestWithSummary) : "",
    reviewCount: items.filter((item) => item.status === "review_required").length,
    totalCount: items.length,
  };
}

export function evidenceSummaryText(item: EvidenceItem) {
  return item.summaryEn || item.summaryTr || "";
}

export function evidenceTypeLabel(type: EvidenceType) {
  const labels: Record<EvidenceType, string> = {
    bank: "Bank proof",
    contract: "Contract",
    listing: "Listing proof",
    message: "Message",
    photo: "Photo",
  };
  return labels[type] || "Evidence";
}

export function evidenceStatusLabel(status: EvidenceStatus | "missing") {
  const labels: Record<EvidenceStatus | "missing", string> = {
    available: "Available",
    failed: "Failed",
    missing: "Missing",
    processing: "Processing",
    review_required: "Review",
    uploaded: "Uploaded",
  };
  return labels[status] || status;
}

function mapEvidenceRow(row: EvidenceRow): EvidenceItem {
  return {
    confidence: row.confidence,
    createdAt: row.created_at,
    extractedJson: row.extracted_json || {},
    fileName: row.file_name,
    filePath: row.file_path,
    fileType: row.file_type,
    id: row.id,
    status: row.status,
    summaryEn: row.summary_en,
    summaryTr: row.summary_tr,
    type: row.type,
    updatedAt: row.updated_at,
  };
}

async function readFileAsArrayBuffer(uri: string) {
  const FileSystem = await import("expo-file-system/legacy");
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64ToArrayBuffer(base64);
}

function base64ToArrayBuffer(base64: string) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 120)
    || "evidence-file";
}
