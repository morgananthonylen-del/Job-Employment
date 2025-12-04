import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser || authUser.userType !== "business") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all threads for this business, ordered by last message
    // Use NULLS LAST to ensure threads without messages appear at the end
    const { data: threads, error: threadsError } = await supabaseAdmin
      .from("job_post_threads")
      .select(`
        id,
        job_id,
        job_seeker_id,
        last_message_at,
        created_at
      `)
      .eq("business_id", authUser.userId)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    
    console.log("Business conversations query:", {
      businessId: authUser.userId,
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

    // Fetch job and job seeker details separately
    const jobIds = Array.from(new Set(threads.map((t: any) => t.job_id)));
    const jobSeekerIds = Array.from(new Set(threads.map((t: any) => t.job_seeker_id)));

    const [jobsResult, jobSeekersResult] = await Promise.all([
      supabaseAdmin
        .from("jobs")
        .select("id, title, promotion_tier")
        .in("id", jobIds),
      supabaseAdmin
        .from("users")
        .select("id, name, avatar_url")
        .in("id", jobSeekerIds),
    ]);

    const jobsMap = new Map((jobsResult.data || []).map((j: any) => [j.id, j]));
    const jobSeekersMap = new Map((jobSeekersResult.data || []).map((u: any) => [u.id, u]));

    // Normalize the threads with job and job seeker data
    const normalizedThreads = threads.map((thread: any) => ({
      id: thread.id,
      jobId: thread.job_id,
      jobSeekerId: thread.job_seeker_id,
      lastMessageAt: thread.last_message_at,
      createdAt: thread.created_at,
      job: jobsMap.get(thread.job_id) || null,
      jobSeeker: jobSeekersMap.get(thread.job_seeker_id) || null,
    }));

    // Get unread message counts for each thread
    const threadIds = normalizedThreads.map((t: any) => t.id);
    let unreadCounts: Record<string, number> = {};
    
    if (threadIds.length > 0) {
      // Get the last message ID for each thread to determine unread count
      // For now, we'll return 0 as unread (can be enhanced later with read receipts)
      threadIds.forEach((id: string) => {
        unreadCounts[id] = 0;
      });
    }

    const threadsWithUnread = normalizedThreads.map((thread: any) => ({
      ...thread,
      unreadCount: unreadCounts[thread.id] || 0,
    }));

    return NextResponse.json(threadsWithUnread);
  } catch (error: any) {
    console.error("Error in conversations route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

