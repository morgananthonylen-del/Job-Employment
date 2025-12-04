import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ApplicationRecord = {
  id: string;
  job_id: string;
  cover_letter: string | null;
  resume_url: string | null;
  status: string | null;
  created_at: string;
  job: {
    id: string;
    business_id: string;
    title: string | null;
  } | null;
  job_seeker?: {
    id: string;
    name: string | null;
    email: string | null;
    avatar_url?: string | null;
  } | null;
};

async function loadApplication(applicationId: string): Promise<ApplicationRecord | null> {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select(
      `
        id,
        job_id,
        cover_letter,
        resume_url,
        status,
        created_at,
        job:jobs!applications_job_id_fkey(
          id,
          business_id,
          title
        ),
        job_seeker:users!applications_job_seeker_id_fkey(
          id,
          name,
          email,
          avatar_url
        )
      `
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load application for review route:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  const jobRecord = Array.isArray(data.job) ? data.job?.[0] : data.job;
  const jobSeekerRecord = Array.isArray(data.job_seeker) ? data.job_seeker?.[0] : data.job_seeker;

  const normalized: ApplicationRecord = {
    id: data.id,
    job_id: data.job_id,
    cover_letter: data.cover_letter,
    resume_url: data.resume_url,
    status: data.status,
    created_at: data.created_at,
    job: jobRecord
      ? {
          id: jobRecord.id ?? "",
          business_id: jobRecord.business_id ?? "",
          title: jobRecord.title ?? null,
        }
      : null,
    job_seeker: jobSeekerRecord
      ? {
          id: jobSeekerRecord.id ?? "",
          name: jobSeekerRecord.name ?? null,
          email: jobSeekerRecord.email ?? null,
          avatar_url: jobSeekerRecord.avatar_url ?? null,
        }
      : null,
  };

  return normalized;
}

async function loadReview(applicationId: string) {
  const { data, error } = await supabaseAdmin
    .from("application_reviews")
    .select("id, rating, note, ai_rating, ai_summary, ai_version, updated_at")
    .eq("application_id", applicationId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load application review:", error);
    throw error;
  }
  return data;
}

async function loadOrderedApplications(jobId: string) {
  const { data, error } = await supabaseAdmin
    .from("applications")
    .select("id, created_at, status")
    .eq("job_id", jobId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load ordered applications:", error);
    throw error;
  }
  return data || [];
}

async function updateProgress(params: {
  jobId: string;
  businessId: string;
  lastReviewedApplicationId: string;
  reviewedCount: number;
  totalApplications: number;
}) {
  const { error } = await supabaseAdmin.from("business_review_progress").upsert(
    {
      job_id: params.jobId,
      business_id: params.businessId,
      last_reviewed_application_id: params.lastReviewedApplicationId,
      reviewed_count: params.reviewedCount,
      total_applications: params.totalApplications,
      resumed_at: new Date().toISOString(),
    },
    { onConflict: "job_id,business_id" }
  );

  if (error) {
    console.error("Failed to upsert business review progress:", error);
    throw error;
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await context.params;
    const application = await loadApplication(applicationId);

    if (!application || !application.job) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 });
    }

    if (authUser.userType === "business") {
      if (application.job.business_id !== authUser.userId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    } else if (authUser.userType === "jobseeker") {
      if (application.job_seeker?.id !== authUser.userId) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const review = await loadReview(applicationId);
    const ordered = await loadOrderedApplications(application.job.id);
    const total = ordered.length;
    const position = ordered.findIndex((item) => item.id === applicationId);
    const previousApplication = position > 0 ? ordered[position - 1] : null;
    const nextApplication = position >= 0 && position + 1 < total ? ordered[position + 1] : null;

    return NextResponse.json({
      application: {
        id: application.id,
        jobId: application.job.id,
        jobTitle: application.job.title,
        status: application.status,
        createdAt: application.created_at,
        coverLetter: application.cover_letter,
        resumeUrl: application.resume_url,
        jobSeeker: application.job_seeker
          ? {
              id: application.job_seeker.id,
              name: application.job_seeker.name,
              email: application.job_seeker.email,
              avatarUrl: application.job_seeker.avatar_url ?? null,
            }
          : null,
      },
      review: review
        ? {
            id: review.id,
            rating: review.rating,
            note: review.note,
            updatedAt: review.updated_at,
          }
        : null,
      aiSuggestion: review
        ? {
            rating: review.ai_rating,
            summary: review.ai_summary,
            version: review.ai_version,
          }
        : null,
      progress: {
        position: position >= 0 ? position + 1 : null,
        total,
        previousApplicationId: previousApplication?.id ?? null,
        nextApplicationId: nextApplication?.id ?? null,
      },
    });
  } catch (error: any) {
    console.error("Review GET route failed:", error);
    return NextResponse.json(
      { message: "Failed to load review data", error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser || authUser.userType !== "business") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await context.params;
    const application = await loadApplication(applicationId);

    if (!application || !application.job) {
      return NextResponse.json({ message: "Application not found" }, { status: 404 });
    }

    if (application.job.business_id !== authUser.userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const rating = body?.rating;
    const note = typeof body?.note === "string" ? body.note.trim() : null;
    const advance = body?.advance !== false;

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Rating must be a number between 1 and 5." },
        { status: 400 }
      );
    }

    // Upsert application review with manual rating/note
    const reviewPayload = {
      application_id: applicationId,
      reviewer_id: authUser.userId,
      rating,
      note,
      updated_at: new Date().toISOString(),
    };

    const { error: reviewError } = await supabaseAdmin
      .from("application_reviews")
      .upsert(reviewPayload, { onConflict: "application_id" });

    if (reviewError) {
      console.error("Failed to upsert application review:", reviewError);
      throw reviewError;
    }

    // Mark application as reviewed
    const { error: applicationUpdateError } = await supabaseAdmin
      .from("applications")
      .update({
        status: "reviewed",
        reviewed_at: new Date().toISOString(),
        reviewed_by: authUser.userId,
        notes: note,
      })
      .eq("id", applicationId);

    if (applicationUpdateError) {
      console.error("Failed to update application record:", applicationUpdateError);
      throw applicationUpdateError;
    }

    const ordered = await loadOrderedApplications(application.job.id);
    const total = ordered.length;
    const position = ordered.findIndex((item) => item.id === applicationId);
    const reviewedCount = position >= 0 ? position + 1 : total;

    let nextApplicationId: string | null = null;
    if (advance && position >= 0 && position + 1 < total) {
      nextApplicationId = ordered[position + 1].id;
    }

    await updateProgress({
      jobId: application.job.id,
      businessId: authUser.userId,
      lastReviewedApplicationId: applicationId,
      reviewedCount,
      totalApplications: total,
    });

    return NextResponse.json({
      message: "Review saved",
      nextApplicationId,
      progress: {
        position: position >= 0 ? position + 1 : reviewedCount,
        total,
      },
    });
  } catch (error: any) {
    console.error("Review POST route failed:", error);
    return NextResponse.json(
      { message: "Failed to save review", error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}


