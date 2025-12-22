import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "Heroe Slider Images";

export async function POST(request: NextRequest) {
  try {
    // For now, allow access without auth check (matching other admin routes)
    // TODO: Add proper admin authentication in production
    // You can uncomment the code below to add auth checks:
    /*
    const authUser = getAuthUser(request);
    const adminHeader = request.headers.get("x-admin-logged-in");
    const adminCookie = request.cookies.get("admin_logged_in")?.value;
    const isAdmin = authUser && (authUser.userType === "admin" || authUser.role === "admin");
    const hasAdminFlag = adminHeader === "true" || adminCookie === "true";
    
    if (!isAdmin && !hasAdminFlag) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    */

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

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Invalid image file format. Please upload a JPG, PNG, WebP, or GIF image." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "Image file is too large. Maximum file size is 10MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = file.name.split(".").pop()?.toLowerCase() || "png";
    const filePath = `hero-slides/${Date.now()}-${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "image/png",
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload hero slider image", error: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl, path: filePath });
  } catch (error: any) {
    console.error("Hero slider upload error:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // For now, allow access without auth check (matching other admin routes)
    // TODO: Add proper admin authentication in production

    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: "Supabase storage is not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ message: "Path is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path]);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json(
        { message: "Failed to delete hero slider image", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error: any) {
    console.error("Hero slider delete error:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

