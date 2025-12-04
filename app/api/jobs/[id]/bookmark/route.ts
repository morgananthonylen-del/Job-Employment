import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import jwt from "jsonwebtoken";

async function authenticate(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    throw new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as { userId: string; userType: string };
    return decoded;
  } catch (_error) {
    throw new Response(JSON.stringify({ message: "Invalid token" }), {
      status: 401,
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await authenticate(request);
    const { id } = await params;

    if (decoded.userType !== "jobseeker") {
      return NextResponse.json(
        { message: "Only job seekers can bookmark jobs." },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from("saved_jobs")
      .upsert(
        {
          job_id: id,
          job_seeker_id: decoded.userId,
        },
        { onConflict: "job_id,job_seeker_id" }
      );

    if (error) {
      console.error("[Bookmark] Supabase upsert error:", error);
      return NextResponse.json(
        { message: "Failed to save job", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Job saved" });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decoded = await authenticate(request);
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("saved_jobs")
      .delete()
      .eq("job_id", id)
      .eq("job_seeker_id", decoded.userId);

    if (error) {
      console.error("[Bookmark] Supabase delete error:", error);
      return NextResponse.json(
        { message: "Failed to remove saved job", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Bookmark removed" });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof Response) {
    return error;
  }

  console.error("[Bookmark] Unexpected server error:", error);

  return NextResponse.json(
    {
      message: "Server error",
      error: (error as Error).message || "Unknown error",
    },
    { status: 500 }
  );
}


