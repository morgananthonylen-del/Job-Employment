import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// GET or CREATE a thread for a job post
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser || authUser.userType !== "jobseeker") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Verify the job exists and is Pro tier
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, business_id, promotion_tier, contact_preference")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.promotion_tier !== "pro") {
      return NextResponse.json(
        { error: "Messaging is only available for Pro job posts" },
        { status: 403 }
      );
    }

    // Check if thread already exists
    const { data: existingThread, error: threadCheckError } = await supabase
      .from("job_post_threads")
      .select("id")
      .eq("job_id", jobId)
      .eq("job_seeker_id", authUser.userId)
      .single();

    if (existingThread) {
      return NextResponse.json(existingThread);
    }

    // Create new thread
    const { data: thread, error: threadError } = await supabase
      .from("job_post_threads")
      .insert({
        job_id: jobId,
        job_seeker_id: authUser.userId,
        business_id: job.business_id,
      })
      .select()
      .single();

    if (threadError) {
      console.error("Error creating thread:", threadError);
      return NextResponse.json(
        { error: threadError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(thread, { status: 201 });
  } catch (error: any) {
    console.error("Error in threads route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}





