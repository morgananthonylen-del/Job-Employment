import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { unstable_cache } from "next/cache";

// Cache jobs list for 60 seconds to reduce function executions
const getCachedJobs = unstable_cache(
  async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        description,
        requirements,
        location,
        salary,
        job_type,
        image_url,
        contact_preference,
        promotion_tier,
        application_deadline,
        created_at,
        business:users!jobs_business_id_fkey(id, name, company_name, email, phone_number, company_logo_url)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100); // Limit to prevent large responses

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },
  ['jobs-list'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['jobs']
  }
);

export async function GET(request: NextRequest) {
  try {
    const jobs = await getCachedJobs();
    
    // Add cache headers to reduce bandwidth
    const response = NextResponse.json(jobs);
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120'
    );
    
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (authUser.userType !== "business") {
      return NextResponse.json(
        { message: "Only companies can post jobs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      location,
      requirements,
      salary,
      job_type,
      image_url,
      contact_preference,
      promotion_tier,
      application_deadline,
    } = body;

    // Validate required fields
    if (!title || !description || !location) {
      return NextResponse.json(
        { message: "Title, description, and location are required" },
        { status: 400 }
      );
    }

    if (!application_deadline) {
      return NextResponse.json(
        { message: "Application deadline is required" },
        { status: 400 }
      );
    }

    const deadlineDate = new Date(application_deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (Number.isNaN(deadlineDate.getTime()) || deadlineDate < now) {
      return NextResponse.json(
        { message: "application_deadline_must_be_future" },
        { status: 400 }
      );
    }

    // Check if user exists and is verified
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, is_email_verified, is_banned")
      .eq("id", authUser.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.is_banned) {
      return NextResponse.json(
        { message: "Your account has been banned" },
        { status: 403 }
      );
    }

    if (!user.is_email_verified) {
      return NextResponse.json(
        { message: "Please verify your email before posting jobs" },
        { status: 403 }
      );
    }

    // Create job
    const allowedContactPreferences = ["message", "call", "both"];
    const preferenceToUse =
      typeof contact_preference === "string" && allowedContactPreferences.includes(contact_preference)
        ? contact_preference
        : "message";

    const allowedTiers = ["free", "pro"];
    const tierToUse =
      typeof promotion_tier === "string" && allowedTiers.includes(promotion_tier)
        ? promotion_tier
        : "free";

    const shouldAllowImage = tierToUse === "pro";

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        business_id: authUser.userId,
        title,
        description,
        location,
        requirements: requirements || null,
        salary: salary || null,
        job_type: job_type || "full-time",
        image_url: shouldAllowImage && image_url ? image_url : null,
        contact_preference: preferenceToUse,
        promotion_tier: tierToUse,
        is_active: true,
        application_deadline: deadlineDate.toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error("Job creation error:", jobError);
      return NextResponse.json(
        { message: jobError.message || "Error creating job", error: jobError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    console.error("Job creation error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

