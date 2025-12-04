import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: jobId } = await context.params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify job belongs to business
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("business_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { message: "Job not found" },
        { status: 404 }
      );
    }

    if (job.business_id !== authUser.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Block user from this job
    const { error: blockError } = await supabase
      .from("job_blocked_applicants")
      .insert({
        job_id: jobId,
        user_id: userId,
      });

    if (blockError) {
      // If already blocked, that's fine
      if (blockError.code === "23505") {
        return NextResponse.json({ message: "User already blocked" });
      }
      return NextResponse.json(
        { message: "Error blocking user", error: blockError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "User blocked successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: jobId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify job belongs to business
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("business_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { message: "Job not found" },
        { status: 404 }
      );
    }

    if (job.business_id !== authUser.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Unblock user
    const { error: unblockError } = await supabase
      .from("job_blocked_applicants")
      .delete()
      .eq("job_id", jobId)
      .eq("user_id", userId);

    if (unblockError) {
      return NextResponse.json(
        { message: "Error unblocking user", error: unblockError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "User unblocked successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

