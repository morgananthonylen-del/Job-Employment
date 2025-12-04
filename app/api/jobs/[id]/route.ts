import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const { data: job, error } = await supabase
      .from("jobs")
      .select(`
        *,
        business:users!jobs_business_id_fkey(id, name, company_name, email, phone_number, company_logo_url)
      `)
      .eq("id", id)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { message: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const { id } = await context.params;
    const body = await request.json();
    const {
      title,
      description,
      location,
      requirements,
      salary,
      job_type,
      is_active,
      image_url,
      promotion_tier,
      application_deadline,
      contact_preference,
    } = body;

    // Check if job exists and user owns it
    const { data: existingJob, error: fetchError } = await supabase
      .from("jobs")
      .select("business_id, promotion_tier, image_url")
      .eq("id", id)
      .single();

    if (fetchError || !existingJob) {
      return NextResponse.json(
        { message: "Job not found" },
        { status: 404 }
      );
    }

    if (existingJob.business_id !== authUser.userId) {
      return NextResponse.json(
        { message: "You can only edit your own jobs" },
        { status: 403 }
      );
    }

    // Update job
    const updateData: any = {};
    const allowedTiers = ["free", "pro"];
    let tierToUse = existingJob.promotion_tier || "free";
    if (promotion_tier !== undefined) {
      if (typeof promotion_tier === "string" && allowedTiers.includes(promotion_tier)) {
        tierToUse = promotion_tier;
        updateData.promotion_tier = tierToUse;
      }
    }

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (salary !== undefined) updateData.salary = salary;
    if (job_type !== undefined) updateData.job_type = job_type;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (image_url !== undefined) {
      updateData.image_url = tierToUse === "pro" ? image_url : null;
    } else if (tierToUse !== existingJob.promotion_tier && tierToUse !== "pro") {
      updateData.image_url = null;
    }

    if (contact_preference !== undefined) {
      const allowedPrefs = ["message", "call", "both"];
      if (
        typeof contact_preference === "string" &&
        allowedPrefs.includes(contact_preference)
      ) {
        updateData.contact_preference = contact_preference;
      }
    }

    if (application_deadline !== undefined) {
      if (!application_deadline) {
        return NextResponse.json(
          { message: "application_deadline_must_be_future" },
          { status: 400 }
        );
      }
      const deadlineDate = new Date(application_deadline);
      const now = new Date();
      if (Number.isNaN(deadlineDate.getTime()) || deadlineDate <= now) {
        return NextResponse.json(
          { message: "application_deadline_must_be_future" },
          { status: 400 }
        );
      }
      updateData.application_deadline = deadlineDate.toISOString();
    }

    const { data: job, error: updateError } = await supabase
      .from("jobs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { message: "Error updating job", error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(job);
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

    const { id } = await context.params;

    // Check if job exists and user owns it
    const { data: existingJob, error: fetchError } = await supabase
      .from("jobs")
      .select("business_id")
      .eq("id", id)
      .single();

    if (fetchError || !existingJob) {
      return NextResponse.json(
        { message: "Job not found" },
        { status: 404 }
      );
    }

    if (existingJob.business_id !== authUser.userId) {
      return NextResponse.json(
        { message: "You can only delete your own jobs" },
        { status: 403 }
      );
    }

    // Delete job
    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { message: "Error deleting job", error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

