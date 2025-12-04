import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser || authUser.userType !== "jobseeker") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all threads for this job seeker, ordered by last message
    // First try with last_message_at, if column doesn't exist, fall back to created_at
    let { data: threads, error: threadsError } = await supabaseAdmin
      .from("job_post_threads")
      .select(`
        id,
        job_id,
        business_id,
        last_message_at,
        created_at
      `)
      .eq("job_seeker_id", authUser.userId);
    
    // If error is about missing column, try without ordering by last_message_at
    if (threadsError && threadsError.message?.includes("last_message_at")) {
      console.warn("last_message_at column missing, using created_at for ordering");
      const result = await supabaseAdmin
        .from("job_post_threads")
        .select(`
          id,
          job_id,
          business_id,
          created_at
        `)
        .eq("job_seeker_id", authUser.userId)
        .order("created_at", { ascending: false });
      threadsError = result.error;
      // Add null last_message_at for compatibility
      if (result.data) {
        threads = result.data.map((t: any) => ({ ...t, last_message_at: null }));
      } else {
        threads = null;
      }
    } else if (!threadsError && threads) {
      // Order by last_message_at if available
      threads = threads.sort((a: any, b: any) => {
        const aTime = a.last_message_at || a.created_at;
        const bTime = b.last_message_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
    }
    
    console.log("Job seeker conversations query:", {
      jobSeekerId: authUser.userId,
      threadsFound: threads?.length || 0,
      error: threadsError?.message,
    });

    if (threadsError) {
      console.error("Error fetching threads:", threadsError);
      return NextResponse.json(
        { error: threadsError.message },
        { status: 500 }
      );
    }

    if (!threads || threads.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch job and business details separately
    const jobIds = Array.from(new Set(threads.map((t: any) => t.job_id)));
    const businessIds = Array.from(new Set(threads.map((t: any) => t.business_id)));

    const [jobsResult, businessesResult] = await Promise.all([
      supabaseAdmin
        .from("jobs")
        .select("id, title, promotion_tier")
        .in("id", jobIds),
      supabaseAdmin
        .from("users")
        .select("id, name, avatar_url")
        .in("id", businessIds)
        .eq("user_type", "business"),
    ]);

    const jobsMap = new Map((jobsResult.data || []).map((j: any) => [j.id, j]));
    const businessesMap = new Map((businessesResult.data || []).map((u: any) => [u.id, u]));

    // Normalize the threads with job and business data
    const normalizedThreads = threads.map((thread: any) => ({
      id: thread.id,
      jobId: thread.job_id,
      businessId: thread.business_id,
      lastMessageAt: thread.last_message_at,
      createdAt: thread.created_at,
      job: jobsMap.get(thread.job_id) || null,
      business: businessesMap.get(thread.business_id) || null,
    }));

    return NextResponse.json(normalizedThreads);
  } catch (error: any) {
    console.error("Error in conversations route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

