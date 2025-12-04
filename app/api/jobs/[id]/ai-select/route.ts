import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateAiSuggestionForApplication } from "@/lib/aiReview";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AiSelectResult = {
  applicationId: string;
  name: string | null;
  email: string | null;
  rating: number | null;
  summary: string | null;
};

type AiSuggestionResult = Awaited<ReturnType<typeof generateAiSuggestionForApplication>>;

function unwrapAiSuggestion(result: AiSuggestionResult | null) {
  if (!result) return null;
  if ("success" in result && result.success) {
    return result.suggestion ?? null;
  }
  return null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authUser = getAuthUser(request);
    if (!authUser || authUser.userType !== "business") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await context.params;

    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("id, business_id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) {
      console.error("AI select job lookup failed:", jobError);
      return NextResponse.json({ message: "Failed to load job" }, { status: 500 });
    }

    if (!job || job.business_id !== authUser.userId) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    let count = 3;
    let hints: {
      age?: string | null;
      ethnicity?: string | null;
      gender?: string | null;
    } | null = null;
    try {
      const body = await request.json();
      if (typeof body?.count === "number" && Number.isFinite(body.count)) {
        count = Math.max(1, Math.min(20, Math.round(body.count)));
      }
      hints = body?.hints ?? null;
    } catch {
      // ignore body parse errors and use default
    }

    const { data: applications, error: applicationsError } = await supabaseAdmin
      .from("applications")
      .select(
        `
          id,
          created_at,
          job_id,
          job_seeker:users!applications_job_seeker_id_fkey(
            id,
            name,
            email
          )
        `
      )
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });

    if (applicationsError) {
      console.error("AI select applications query failed:", applicationsError);
      return NextResponse.json({ message: "Unable to load applications" }, { status: 500 });
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ message: "No applications found for this job", recommendations: [] }, { status: 200 });
    }

    const normalizedHints = hints
      ? {
          age: hints.age ?? undefined,
          ethnicity: hints.ethnicity && hints.ethnicity !== "any" ? hints.ethnicity : undefined,
          gender: hints.gender && hints.gender !== "any" ? hints.gender : undefined,
        }
      : undefined;

    const aiGenerated = await Promise.all(
      applications.map(async (application) => {
        try {
          const suggestion = await generateAiSuggestionForApplication(application.id, {
            hints: normalizedHints,
          });
          return { application, suggestion };
        } catch (error) {
          console.warn("AI suggestion generation failed for application", application.id, error);
          return { application, suggestion: null };
        }
      })
    );

    const recommendations: AiSelectResult[] = aiGenerated
      .map(({ application, suggestion }) => {
        const aiSuggestion = unwrapAiSuggestion(suggestion);
        const jobSeeker = Array.isArray(application.job_seeker)
          ? application.job_seeker[0] ?? null
          : application.job_seeker ?? null;
        return {
          applicationId: application.id,
          name: jobSeeker?.name ?? null,
          email: jobSeeker?.email ?? null,
          rating: aiSuggestion?.rating ?? null,
          summary: aiSuggestion?.summary ?? null,
        };
      })
      .filter((item): item is AiSelectResult => item.rating !== null)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, count);

    return NextResponse.json({ recommendations, hints: normalizedHints });
  } catch (error: any) {
    console.error("AI select route error:", error);
    return NextResponse.json(
      { message: "Failed to run AI selection", error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

