import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateAiSuggestionForApplication } from "@/lib/aiReview";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function ensureBusinessOwnership(applicationId: string, businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select("id, job:jobs!applications_job_id_fkey(id, business_id)")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    console.error("Failed to verify application ownership:", error);
    throw error;
  }

  if (!data || !data.job) {
    return { ok: false, status: 404, message: "Application not found" as const };
  }

  if ((data.job as { business_id?: string }).business_id !== businessId) {
    return { ok: false, status: 403, message: "Forbidden" as const };
  }

  return { ok: true };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser || authUser.userType !== "business") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await context.params;
    const ownership = await ensureBusinessOwnership(applicationId, authUser.userId);

    if (!ownership.ok) {
      return NextResponse.json({ message: ownership.message }, { status: ownership.status });
    }

    const result = await generateAiSuggestionForApplication(applicationId);
    return NextResponse.json({ message: "AI suggestion triggered", result });
  } catch (error: any) {
    console.error("AI suggestion POST route failed:", error);
    return NextResponse.json(
      { message: "Failed to run AI suggestion", error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}


