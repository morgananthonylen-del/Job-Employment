import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
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
        { message: "Only companies can view applications" },
        { status: 403 }
      );
    }

    // Get all jobs for this business
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id")
      .eq("business_id", authUser.userId);

    if (jobsError) {
      return NextResponse.json(
        { error: jobsError.message },
        { status: 500 }
      );
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json([]);
    }

    const jobIds = jobs.map(j => j.id);

    // Get all applications for these jobs
    const { data: applications, error: appsError } = await supabase
      .from("applications")
      .select(`
        *,
        job:jobs!applications_job_id_fkey(id, title, location),
        job_seeker:users!applications_job_seeker_id_fkey(
          id, name, email, birthday, phone_number, address, city, gender, ethnicity, years_of_experience, avatar_url
        )
      `)
      .in("job_id", jobIds)
      .order("created_at", { ascending: false });

    if (appsError) {
      return NextResponse.json(
        { error: appsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(applications || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

