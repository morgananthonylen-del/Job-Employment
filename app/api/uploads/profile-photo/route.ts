import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "profile";

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser) {
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
    const filePath = `avatars/${authUser.userId}/${Date.now()}-${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload profile photo", error: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl, path: filePath });
  } catch (error: any) {
    console.error("Profile photo upload error:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: "Supabase storage is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    let { path, url } = body || {};

    if (!path && url) {
      try {
        const parsed = new URL(url);
        const marker = `/storage/v1/object/public/${BUCKET}/`;
        const idx = parsed.pathname.indexOf(marker);
        if (idx !== -1) {
          path = parsed.pathname.slice(idx + marker.length);
        }
      } catch (error) {
        console.error("Failed to parse avatar URL", error);
      }
    }

    if (!path) {
      return NextResponse.json(
        { message: "Unable to determine file path for deletion" },
        { status: 400 }
      );
    }

    const { error: removeError } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove([path]);

    if (removeError) {
      console.error("Supabase remove error:", removeError);
      return NextResponse.json(
        { message: "Failed to delete profile photo", error: removeError.message },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ avatar_url: null })
      .eq("id", authUser.userId);

    if (updateError) {
      console.error("Failed to clear avatar url:", updateError);
      return NextResponse.json(
        { message: "Failed to update profile", error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Profile photo delete error:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}


