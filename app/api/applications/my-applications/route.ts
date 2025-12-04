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

    // Get user's applications
    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        job:jobs!applications_job_id_fkey(
          id,
          title,
          description,
          location,
          contact_preference,
          business:users!jobs_business_id_fkey(
            company_name,
            phone_number,
            email,
            company_logo_url
          )
        )
      `)
      .eq("job_seeker_id", decoded.userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
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





