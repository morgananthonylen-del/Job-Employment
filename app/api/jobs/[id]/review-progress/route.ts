import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser || authUser.userType !== "business") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await context.params;

    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("id, business_id, title")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) {
      console.error("Failed to load job for review progress:", jobError);
      throw jobError;
    }

    if (!job) {
      return NextResponse.json({ message: "Job not found" }, { status: 404 });
    }

    if (job.business_id !== authUser.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { data: applications, error: applicationsError } = await supabaseAdmin
      .from("applications")
      .select(
        `
          id,
          status,
          created_at,
          reviewed_at,
          job_seeker:users!applications_job_seeker_id_fkey(
            id,
            name,
            email
          ),
          review:application_reviews(
            rating,
            ai_rating,
            ai_summary,
            updated_at
          )
        `
      )
      .eq("job_id", jobId)
      .order("created_at", { ascending: true });

    if (applicationsError) {
      console.error("Failed to load applications for review progress:", applicationsError);
      throw applicationsError;
    }

    const { data: progress, error: progressError } = await supabaseAdmin
      .from("business_review_progress")
      .select("last_reviewed_application_id, reviewed_count, total_applications, updated_at")
      .eq("job_id", jobId)
      .eq("business_id", authUser.userId)
      .maybeSingle();

    if (progressError) {
      console.error("Failed to load review progress row:", progressError);
      throw progressError;
    }

    const ordered = applications || [];
    const total = ordered.length;

    const lastReviewedId = progress?.last_reviewed_application_id ?? null;
    const lastReviewedIndex = lastReviewedId
      ? ordered.findIndex((item) => item.id === lastReviewedId)
      : -1;

    const nextApplication =
      lastReviewedIndex >= 0 && lastReviewedIndex + 1 < ordered.length
        ? ordered[lastReviewedIndex + 1]
        : ordered[0] ?? null;

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
      },
      queue: ordered.map((application, index) => {
        const jobSeekerRecord = Array.isArray(application.job_seeker)
          ? application.job_seeker[0] ?? null
          : application.job_seeker ?? null;
        const reviewRecord = Array.isArray(application.review)
          ? application.review[0] ?? null
          : application.review ?? null;
        return {
          id: application.id,
          status: application.status,
          createdAt: application.created_at,
          reviewedAt: application.reviewed_at,
          position: index + 1,
          jobSeeker: jobSeekerRecord
            ? {
                id: jobSeekerRecord.id,
                name: jobSeekerRecord.name,
                email: jobSeekerRecord.email,
              }
            : null,
          manualRating: reviewRecord?.rating ?? null,
          aiRating: reviewRecord?.ai_rating ?? null,
          aiSummary: reviewRecord?.ai_summary ?? null,
          reviewUpdatedAt: reviewRecord?.updated_at ?? null,
        };
      }),
      summary: {
        totalApplications: total,
        reviewedCount: progress?.reviewed_count ?? Math.max(lastReviewedIndex + 1, 0),
        lastReviewedApplicationId: lastReviewedId,
        lastReviewedAt: progress?.updated_at ?? null,
        nextApplicationId: nextApplication?.id ?? null,
      },
    });
  } catch (error: any) {
    console.error("Review progress GET route failed:", error);
    return NextResponse.json(
      { message: "Failed to load review progress", error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}


