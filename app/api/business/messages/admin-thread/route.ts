import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthUser } from "@/lib/auth";

// GET or CREATE an admin support thread for a business
export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser || authUser.userType !== "business") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find or create an admin user (placeholder - will be configured later)
    // For now, we'll use a special admin user ID or create one
    let { data: adminUser, error: adminError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("user_type", "admin")
      .limit(1)
      .single();

    // If no admin user exists, create a placeholder (this will be replaced with actual admin setup)
    if (adminError || !adminUser) {
      // Create a placeholder admin user for support threads
      const { data: newAdmin, error: createError } = await supabaseAdmin
        .from("users")
        .insert({
          email: "admin@fastlink.support",
          name: "FastLink Support",
          user_type: "admin",
          password_hash: "", // Admin users won't use password auth
        })
        .select("id")
        .single();

      if (createError || !newAdmin) {
        return NextResponse.json(
          { error: "Admin support system not configured" },
          { status: 500 }
        );
      }
      adminUser = newAdmin;
    }

    // Check if thread already exists for this business with admin
    // We'll use a special job_id of NULL or a system job
    // For now, let's create a system job for admin support
    let { data: adminJob, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("id")
      .eq("business_id", adminUser.id)
      .eq("title", "FastLink Support")
      .limit(1)
      .single();

    if (jobError || !adminJob) {
      // Create a system job for admin support
      const { data: newJob, error: createJobError } = await supabaseAdmin
        .from("jobs")
        .insert({
          business_id: adminUser.id,
          title: "FastLink Support",
          description: "Support thread for FastLink assistance",
          location: "Online",
          job_type: "full-time",
          promotion_tier: "pro",
          salary: "N/A",
          requirements: "Support inquiries",
        })
        .select("id")
        .single();

      if (createJobError || !newJob) {
        console.error("Error creating admin job:", createJobError);
        return NextResponse.json(
          { error: "Failed to initialize support system" },
          { status: 500 }
        );
      }
      adminJob = newJob;
    }

    // Check if thread already exists for this business with admin
    // We need to check by business_id and job_seeker_id (admin user) or by job_id (admin job)
    const { data: existingThreads, error: threadCheckError } = await supabaseAdmin
      .from("job_post_threads")
      .select("id, job_id, business_id, job_seeker_id")
      .eq("business_id", authUser.userId)
      .eq("job_seeker_id", adminUser.id);

    // Also check by admin job
    const { data: existingByJob, error: jobCheckError } = await supabaseAdmin
      .from("job_post_threads")
      .select("id, job_id, business_id, job_seeker_id")
      .eq("job_id", adminJob.id)
      .eq("business_id", authUser.userId);

    // Find existing thread (either by job_seeker_id or job_id)
    const existingThread = existingThreads?.[0] || existingByJob?.[0];

    if (existingThread) {
      return NextResponse.json({
        id: existingThread.id,
        jobId: existingThread.job_id,
        businessId: existingThread.business_id,
        isAdminThread: true,
      });
    }

    // Create new admin support thread
    // Note: For admin threads, business_id is the requesting business, job_seeker_id is NULL (or we use admin as job_seeker)
    const { data: thread, error: threadError } = await supabaseAdmin
      .from("job_post_threads")
      .insert({
        job_id: adminJob.id,
        business_id: authUser.userId, // The business requesting support
        job_seeker_id: adminUser.id, // Admin acts as the "job seeker" in this context
      })
      .select()
      .single();

    if (threadError) {
      console.error("Error creating admin thread:", threadError);
      return NextResponse.json(
        { error: threadError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: thread.id,
      jobId: thread.job_id,
      businessId: thread.business_id,
      isAdminThread: true,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error in admin thread route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

