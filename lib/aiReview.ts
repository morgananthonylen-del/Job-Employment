import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AggregatedApplicationMaterials = {
  applicationId: string;
  jobId: string;
  businessId: string;
  jobTitle: string;
  jobDescription: string;
  jobRequirements: string | null;
  coverLetter: string | null;
  documentText: string | null;
};

type AiSuggestion = {
  rating: number | null;
  summary: string | null;
  raw?: unknown;
};

function canUseAi() {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function fetchApplicationMaterials(applicationId: string): Promise<AggregatedApplicationMaterials | null> {
  const { data: application, error } = await supabaseAdmin
    .from("applications")
    .select(
      `
        id,
        cover_letter,
        job_id,
        job:jobs!applications_job_id_fkey(
          id,
          business_id,
          title,
          description,
          requirements
        )
      `
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error || !application) {
    console.error("Failed to load application for AI review:", error);
    return null;
  }

  const { data: documents, error: docError } = await supabaseAdmin
    .from("application_documents")
    .select("id, extracted_text, status")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true });

  if (docError) {
    console.error("Failed to load extracted documents for AI review:", docError);
  }

  const completedDocs = (documents || []).filter((doc) => doc.status === "completed" && doc.extracted_text);

  const documentText =
    completedDocs.length > 0
      ? completedDocs
          .map((doc, index) => `Document ${index + 1}:\n${doc.extracted_text}`)
          .join("\n\n")
      : null;

  const jobRecord = Array.isArray(application.job) ? application.job[0] ?? null : application.job ?? null;

  return {
    applicationId,
    jobId: jobRecord?.id ?? "",
    businessId: jobRecord?.business_id ?? "",
    jobTitle: jobRecord?.title ?? "Job",
    jobDescription: jobRecord?.description ?? "",
    jobRequirements: jobRecord?.requirements ?? null,
    coverLetter: application.cover_letter ?? null,
    documentText,
  };
}

type AiHints = {
  age?: string | null;
  ethnicity?: string | null;
  gender?: string | null;
};

function buildPrompt(materials: AggregatedApplicationMaterials, hints?: AiHints | null) {
  const sections = [
    `You are an assistant helping business recruiters evaluate candidates.`,
    `Job Title: ${materials.jobTitle}`,
    `Job Description:\n${materials.jobDescription}`,
  ];

  if (materials.jobRequirements) {
    sections.push(`Job Requirements:\n${materials.jobRequirements}`);
  }

  if (materials.coverLetter) {
    sections.push(`Cover Letter:\n${materials.coverLetter}`);
  }

  if (materials.documentText) {
    sections.push(`Candidate Documents:\n${materials.documentText}`);
  } else {
    sections.push("Candidate Documents: No extracted resume text available.");
  }

  sections.push(
    `Provide:\n- A star rating from 1-5 assessing suitability for the role.\n- A concise 2-3 sentence summary describing strengths/concerns.\n\nRespond strictly as JSON with keys "rating" (number 1-5) and "summary" (string).`
  );

  if (hints) {
    const hintLines: string[] = [];
    if (hints.age) {
      hintLines.push(`Preferred age guidance: ${hints.age}`);
    }
    if (hints.ethnicity) {
      hintLines.push(`Ethnicity considerations: ${hints.ethnicity}`);
    }
    if (hints.gender) {
      hintLines.push(`Gender balance notes: ${hints.gender}`);
    }
    if (hintLines.length > 0) {
      sections.push(`Additional recruiter guidance:\n${hintLines.join("\n")}`);
    }
  }

  return sections.join("\n\n");
}

async function callOpenAi(prompt: string): Promise<AiSuggestion | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a structured reviewer for job applications." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    console.error("OpenAI API error", await response.text());
    throw new Error(`OpenAI API responded with status ${response.status}`);
  }

  const body = await response.json();
  const content = body?.choices?.[0]?.message?.content;

  if (!content) {
    console.warn("OpenAI response missing content", body);
    return null;
  }

  try {
    const parsed = JSON.parse(content);
    const rating = Number(parsed.rating);
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : null;
    return {
      rating: Number.isFinite(rating) ? Math.max(1, Math.min(5, Math.round(rating))) : null,
      summary,
      raw: parsed,
    };
  } catch (error) {
    console.error("Failed to parse OpenAI response JSON:", error, content);
    return null;
  }
}

async function upsertAiSuggestion(materials: AggregatedApplicationMaterials, suggestion: AiSuggestion | null) {
  if (!suggestion) return null;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("application_reviews")
    .select("id, rating, note")
    .eq("application_id", materials.applicationId)
    .maybeSingle();

  if (fetchError) {
    console.error("Failed to fetch existing application review:", fetchError);
    return null;
  }

  const payload = {
    application_id: materials.applicationId,
    reviewer_id: materials.businessId,
    ai_rating: suggestion.rating,
    ai_summary: suggestion.summary,
    ai_version: process.env.OPENAI_MODEL || "gpt-4o-mini",
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabaseAdmin
      .from("application_reviews")
      .update(payload)
      .eq("id", existing.id);
    if (error) {
      console.error("Failed to update AI suggestion on application review:", error);
    }
    return existing.id;
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("application_reviews")
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    console.error("Failed to insert AI suggestion on application review:", insertError);
    return null;
  }

  return inserted?.id ?? null;
}

export async function generateAiSuggestionForApplication(
  applicationId: string,
  options?: { hints?: AiHints | null }
) {
  if (!canUseAi()) {
    return { skipped: true, reason: "missing_api_key" };
  }

  const materials = await fetchApplicationMaterials(applicationId);
  if (!materials) {
    return { skipped: true, reason: "missing_materials" };
  }

  if (!materials.coverLetter && !materials.documentText) {
    return { skipped: true, reason: "no_text_available" };
  }

  try {
    const prompt = buildPrompt(materials, options?.hints);
    const suggestion = await callOpenAi(prompt);
    await upsertAiSuggestion(materials, suggestion);
    return { success: true, suggestion };
  } catch (error) {
    console.error("AI suggestion generation failed:", error);
    return { skipped: false, error: (error as Error).message };
  }
}


