type AnalyzeEvidenceRequest = {
  evidence_id?: string;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return json({
      status: "blocked",
      error: "OPENAI_API_KEY is not configured yet.",
      next_step: "Add the key as a Supabase Edge Function secret before enabling AI extraction."
    }, 501);
  }

  let body: AnalyzeEvidenceRequest;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.evidence_id) {
    return json({ error: "Missing evidence_id" }, 400);
  }

  return json({
    status: "queued",
    evidence_id: body.evidence_id,
    message: "AI extraction function scaffold is ready. Implement OpenAI processing after the API key is configured."
  });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
