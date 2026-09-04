type AnalyzeEvidenceRequest = {
  evidence_id?: string;
};

type EvidenceRow = {
  id: string;
  user_id: string;
  type: string;
  file_bucket: string;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  extracted_json: Record<string, unknown> | null;
};

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS"
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  const model = Deno.env.get("GEMINI_DOCUMENT_MODEL") || "gemini-2.5-flash-lite";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!apiKey) return json({ error: "GEMINI_API_KEY is not configured." }, 501);
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: "Supabase function environment is incomplete." }, 500);
  }

  let body: AnalyzeEvidenceRequest;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.evidence_id) return json({ error: "Missing evidence_id" }, 400);

  const authHeader = request.headers.get("authorization") || "";
  const user = await getUser(supabaseUrl, anonKey, authHeader);
  if (!user?.id) return json({ error: "Authentication required" }, 401);

  await updateJob(supabaseUrl, serviceRoleKey, body.evidence_id, {
    status: "processing",
    provider: "gemini",
    started_at: new Date().toISOString(),
    error_message: null
  });

  try {
    const evidence = await fetchEvidence(supabaseUrl, serviceRoleKey, body.evidence_id);
    if (!evidence) return json({ error: "Evidence not found" }, 404);
    if (evidence.user_id !== user.id) return json({ error: "Forbidden" }, 403);

    const file = await downloadEvidenceFile(supabaseUrl, serviceRoleKey, evidence);
    const extraction = await analyzeWithGemini(apiKey, model, evidence, file);
    const status = extraction.confidence >= 0.68 ? "available" : "review_required";

    await updateEvidence(supabaseUrl, serviceRoleKey, evidence.id, {
      status,
      confidence: extraction.confidence,
      summary_tr: extraction.summary_tr,
      summary_en: extraction.summary_en,
      extracted_json: {
        ...(evidence.extracted_json || {}),
        ai: extraction,
        analyzed_at: new Date().toISOString(),
        provider: "gemini"
      },
      updated_at: new Date().toISOString()
    });

    await updateJob(supabaseUrl, serviceRoleKey, evidence.id, {
      status: status === "available" ? "succeeded" : "review_required",
      finished_at: new Date().toISOString(),
      error_message: null
    });

    return json({ status, evidence_id: evidence.id, extraction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown extraction error";
    await updateEvidence(supabaseUrl, serviceRoleKey, body.evidence_id, {
      status: "failed",
      updated_at: new Date().toISOString()
    });
    await updateJob(supabaseUrl, serviceRoleKey, body.evidence_id, {
      status: "failed",
      finished_at: new Date().toISOString(),
      error_message: message
    });
    return json({ error: message }, 500);
  }
});

async function getUser(supabaseUrl: string, anonKey: string, authHeader: string) {
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      authorization: authHeader
    }
  });
  if (!response.ok) return null;
  return await response.json();
}

async function fetchEvidence(supabaseUrl: string, serviceRoleKey: string, evidenceId: string): Promise<EvidenceRow | null> {
  const response = await fetch(`${supabaseUrl}/rest/v1/evidence_items?id=eq.${encodeURIComponent(evidenceId)}&select=*`, {
    headers: serviceHeaders(serviceRoleKey)
  });
  if (!response.ok) throw new Error(`Evidence lookup failed: ${await response.text()}`);
  const rows = await response.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function downloadEvidenceFile(supabaseUrl: string, serviceRoleKey: string, evidence: EvidenceRow) {
  const bucket = encodeURIComponent(evidence.file_bucket);
  const path = evidence.file_path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`
    }
  });
  if (!response.ok) throw new Error(`Evidence file download failed: ${await response.text()}`);
  return {
    mimeType: evidence.file_type || response.headers.get("content-type") || "application/octet-stream",
    base64: bytesToBase64(new Uint8Array(await response.arrayBuffer()))
  };
}

async function analyzeWithGemini(apiKey: string, model: string, evidence: EvidenceRow, file: { mimeType: string; base64: string }) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          {
            text: [
              "Analyze this tenant evidence for a Turkey rental assistant app.",
              `Evidence type hint: ${evidence.type}. File name: ${evidence.file_name}.`,
              "Return JSON only with these exact keys:",
              "document_type, detected_language, rent_amount, deposit_amount, payment_date, sender, recipient, address, landlord_or_agent, summary_tr, summary_en, risk_flags, missing_fields, confidence.",
              "Use null when a scalar field is not visible.",
              "risk_flags and missing_fields must be arrays of strings.",
              "confidence must be a number from 0 to 1.",
              "Do not include markdown, code fences, or commentary outside the JSON object."
            ].join(" ")
          },
          {
            inlineData: {
              mimeType: file.mimeType,
              data: file.base64
            }
          }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    })
  });

  if (!response.ok) throw new Error(`Gemini analysis failed: ${await response.text()}`);
  const result = await response.json();
  const parsed = parseJsonObject(extractGeminiText(result));
  return {
    document_type: parsed.document_type || evidence.type,
    detected_language: parsed.detected_language || null,
    rent_amount: parsed.rent_amount ?? null,
    deposit_amount: parsed.deposit_amount ?? null,
    payment_date: parsed.payment_date ?? null,
    sender: parsed.sender ?? null,
    recipient: parsed.recipient ?? null,
    address: parsed.address ?? null,
    landlord_or_agent: parsed.landlord_or_agent ?? null,
    summary_tr: parsed.summary_tr || "Belge analiz edildi; önemli alanlar çıkarıldı.",
    summary_en: parsed.summary_en || "Document analyzed and key fields were extracted.",
    risk_flags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
    missing_fields: Array.isArray(parsed.missing_fields) ? parsed.missing_fields : [],
    confidence: clamp(Number(parsed.confidence ?? 0.5), 0, 1)
  };
}

async function updateEvidence(supabaseUrl: string, serviceRoleKey: string, evidenceId: string, payload: Record<string, unknown>) {
  const response = await fetch(`${supabaseUrl}/rest/v1/evidence_items?id=eq.${encodeURIComponent(evidenceId)}`, {
    method: "PATCH",
    headers: serviceHeaders(serviceRoleKey, true),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Evidence update failed: ${await response.text()}`);
}

async function updateJob(supabaseUrl: string, serviceRoleKey: string, evidenceId: string, payload: Record<string, unknown>) {
  await fetch(`${supabaseUrl}/rest/v1/extraction_jobs?evidence_id=eq.${encodeURIComponent(evidenceId)}`, {
    method: "PATCH",
    headers: serviceHeaders(serviceRoleKey, true),
    body: JSON.stringify(payload)
  });
}

function serviceHeaders(serviceRoleKey: string, jsonBody = false) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    ...(jsonBody ? { "content-type": "application/json", prefer: "return=minimal" } : {})
  };
}

function extractGeminiText(result: Record<string, unknown>) {
  const candidates = Array.isArray(result.candidates) ? result.candidates : [];
  return candidates
    .flatMap((candidate: any) => Array.isArray(candidate.content?.parts) ? candidate.content.parts : [])
    .map((part: any) => part.text || "")
    .join("\n")
    .trim();
}

function parseJsonObject(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Gemini did not return parseable JSON.");
    return JSON.parse(match[0]);
  }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json; charset=utf-8"
    }
  });
}
