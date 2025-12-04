import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
      return NextResponse.json(
        { message: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as { userId: string; userType: string };

    const { data, error } = await supabaseAdmin
      .from("saved_jobs")
      .select(
        `
          id,
          created_at,
          job:jobs!saved_jobs_job_id_fkey(
            id,
            title,
            description,
            location,
            job_type,
            salary,
            created_at,
            business:users!jobs_business_id_fkey(
              company_name,
              name,
              company_logo_url
            )
          )
        `
      )
      .eq("job_seeker_id", decoded.userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Saved jobs] Supabase select error:", error);
      return NextResponse.json(
        { message: "Failed to load saved jobs", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    console.error("[Saved jobs] Unexpected server error:", error);

    return NextResponse.json(
      { message: "Server error", error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}


