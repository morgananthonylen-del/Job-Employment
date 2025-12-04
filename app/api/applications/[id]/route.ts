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
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const { data: application, error } = await supabase
      .from("applications")
      .select(`
        *,
        job:jobs!applications_job_id_fkey(id, title, description, location, business_id),
        job_seeker:users!applications_job_seeker_id_fkey(
          id, name, email, birthday, phone_number, address, city, gender, ethnicity, years_of_experience
        )
      `)
      .eq("id", id)
      .single();

    if (error || !application) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    // Verify business owns the job
    if (authUser.userType === "business" && application.job?.business_id !== authUser.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json(application);
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

    if (authUser.userType !== "business") {
      return NextResponse.json(
        { message: "Only companies can update applications" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, notes } = body;

    // Get application to verify ownership
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select(`
        *,
        job:jobs!applications_job_id_fkey(business_id)
      `)
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { message: "Application not found" },
        { status: 404 }
      );
    }

    if (application.job?.business_id !== authUser.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update application
    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (status) {
      updateData.reviewed_at = new Date().toISOString();
      updateData.reviewed_by = authUser.userId;
    }

    const { data: updated, error: updateError } = await supabase
      .from("applications")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { message: "Error updating application", error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

