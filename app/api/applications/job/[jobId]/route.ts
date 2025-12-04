import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { sendNewApplicationEmail } from "@/lib/emailService";
import { registerApplicationDocument } from "@/lib/documentProcessing";

type RouteContext = {
  params: Promise<{ jobId: string }>;
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

    const { jobId } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const minAge = searchParams.get("minAge");
    const maxAge = searchParams.get("maxAge");
    const ethnicity = searchParams.get("ethnicity");
    const minExperience = searchParams.get("minExperience");
    const gender = searchParams.get("gender");
    const status = searchParams.get("status");

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

    // Get applications for this job
    let query = supabase
      .from("applications")
      .select(`
        *,
        job_seeker:users!applications_job_seeker_id_fkey(
          id, name, email, birthday, phone_number, address, city, gender, ethnicity, years_of_experience
        )
      `)
      .eq("job_id", jobId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: applications, error: appsError } = await query.order("created_at", { ascending: false });

    if (appsError) {
      return NextResponse.json(
        { error: appsError.message },
        { status: 500 }
      );
    }

    // Apply client-side filters
    let filtered = applications || [];

    if (minAge || maxAge || ethnicity || minExperience || gender) {
      filtered = filtered.filter((app: any) => {
        const seeker = app.job_seeker;
        if (!seeker) return false;

        // Age filter
        if (minAge || maxAge) {
          if (!seeker.birthday) return false;
          const age = new Date().getFullYear() - new Date(seeker.birthday).getFullYear();
          if (minAge && age < parseInt(minAge)) return false;
          if (maxAge && age > parseInt(maxAge)) return false;
        }

        // Ethnicity filter
        if (ethnicity && seeker.ethnicity !== ethnicity) return false;

        // Experience filter
        if (minExperience && (seeker.years_of_experience || 0) < parseInt(minExperience)) return false;

        // Gender filter
        if (gender && seeker.gender !== gender) return false;

        return true;
      });
    }

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser || authUser.userType !== "jobseeker") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await context.params;
    const { coverLetter, resumeUrl } = await request.json();

    if (!coverLetter && !resumeUrl) {
      return NextResponse.json(
        { message: "Provide a cover letter or attach a resume." },
        { status: 400 }
      );
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        is_active,
        promotion_tier,
        business:users!jobs_business_id_fkey(
          id,
          email,
          name,
          company_name
        )
      `)
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { message: "Job not found" },
        { status: 404 }
      );
    }

    if (!job.is_active) {
      return NextResponse.json(
        { message: "This job is no longer accepting applications." },
        { status: 400 }
      );
    }

    const { data: blocked } = await supabase
      .from("job_blocked_applicants")
      .select("user_id")
      .eq("job_id", jobId)
      .eq("user_id", authUser.userId)
      .maybeSingle();

    if (blocked) {
      return NextResponse.json(
        { message: "You are blocked from applying to this job." },
        { status: 403 }
      );
    }

    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("job_id", jobId)
      .eq("job_seeker_id", authUser.userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { message: "You have already applied for this job." },
        { status: 400 }
      );
    }

    const { data: insertedApplication, error: insertError } = await supabase
      .from("applications")
      .insert({
        job_id: jobId,
        job_seeker_id: authUser.userId,
        cover_letter: coverLetter || "",
        resume_url: resumeUrl || null,
        status: "pending",
      })
      .select("id, resume_url")
      .single();

    if (insertError) {
      console.error("Application insert error:", insertError);
      return NextResponse.json(
        { message: "Failed to submit application", error: insertError.message },
        { status: 500 }
      );
    }

    if (insertedApplication?.resume_url) {
      try {
        await registerApplicationDocument({
          applicationId: insertedApplication.id,
          resumeUrl: insertedApplication.resume_url,
          documentType: "resume",
        });
      } catch (registerError) {
        console.error("Failed to register resume for document processing:", registerError);
      }
    }

    const jobData = job as {
      title?: string;
      promotion_tier?: string;
      business?: { email?: string; name?: string; company_name?: string };
    };

    const { data: applicant } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", authUser.userId)
      .single();

    const businessEmail = jobData?.business?.email;
    const businessName =
      jobData?.business?.company_name || jobData?.business?.name || "Your FastLink team";
    const applicantName = applicant?.name || "A FastLink job seeker";

    if (businessEmail) {
      sendNewApplicationEmail({
        to: businessEmail,
        businessName,
        jobTitle: jobData?.title || "Your job listing",
        applicantName,
        promotionTier: jobData?.promotion_tier === "pro" ? "pro" : "free",
      }).catch((notifyError) => {
        console.error("Failed to send business application notification:", notifyError);
      });
    }

    return NextResponse.json({ message: "Application submitted" }, { status: 201 });
  } catch (error: any) {
    console.error("Application submit error:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

