import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser || authUser.userType !== "business") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: "Supabase storage is not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "File is required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const filePath = `job-images/${authUser.userId}/${Date.now()}-${randomUUID()}.${extension}`;

    const bucket = "vacancies";

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload image", error: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl, path: filePath });
  } catch (error: any) {
    console.error("Job image upload error:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
