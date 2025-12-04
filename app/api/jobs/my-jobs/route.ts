import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as { userId: string; userType: string };

    // Get user's jobs with applicant counts
    const { data, error } = await supabase
      .from("jobs")
      .select("*, applications:applications(count)")
      .eq("business_id", decoded.userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const jobsWithCounts = (data || []).map((job: any) => {
      const applicantCount = Array.isArray(job.applications) && job.applications.length > 0
        ? job.applications[0]?.count || 0
        : 0;

      const { applications, ...rest } = job;
      return {
        ...rest,
        applicants_count: applicantCount,
      };
    });

    return NextResponse.json(jobsWithCounts);
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

