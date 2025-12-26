import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const IMAGE_BUCKET = "Heroe Slider Images";
const VIDEO_BUCKET = "video";

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: "Supabase storage is not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const mediaType = (formData.get("mediaType") as string) || "image";

    console.log("Upload request received:", {
      fileName: file instanceof File ? file.name : "not a file",
      fileType: file instanceof File ? file.type : "not a file",
      mediaType: mediaType,
    });

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "File is required" }, { status: 400 });
    }

    // Validate file type based on media type
    if (mediaType === "image") {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { message: "Invalid image file format. Please upload a JPG, PNG, WebP, or GIF image." },
          { status: 400 }
        );
      }
    } else if (mediaType === "video") {
      const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { message: "Invalid video file format. Please upload an MP4, WebM, OGG, or QuickTime video." },
          { status: 400 }
        );
      }
    }

    // Validate file size (max 10MB for images, 100MB for videos)
    const maxSize = mediaType === "image" ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          message: mediaType === "image" 
            ? "Image file is too large. Maximum file size is 10MB."
            : "Video file is too large. Maximum file size is 100MB."
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = file.name.split(".").pop()?.toLowerCase() || (mediaType === "image" ? "png" : "mp4");
    const filePath = `hero-slides/${Date.now()}-${randomUUID()}.${extension}`;

    // Use appropriate bucket based on media type
    const bucket = mediaType === "video" ? VIDEO_BUCKET : IMAGE_BUCKET;
    
    console.log("Uploading to bucket:", bucket, "with mediaType:", mediaType);

    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || (mediaType === "image" ? "image/png" : "video/mp4"),
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { message: `Failed to upload hero ${mediaType}`, error: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
    
    console.log("Upload successful:", {
      bucket: bucket,
      mediaType: mediaType,
      url: publicUrl,
    });

    // Return both url and videoUrl for consistency (videoUrl will be null for images)
    return NextResponse.json({ 
      url: mediaType === "image" ? publicUrl : null,
      videoUrl: mediaType === "video" ? publicUrl : null,
      path: filePath 
    });
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
    const mediaType = searchParams.get("mediaType") || "image";

    if (!path) {
      return NextResponse.json({ message: "Path is required" }, { status: 400 });
    }

    // Determine bucket based on media type or file extension
    const bucket = mediaType === "video" ? VIDEO_BUCKET : IMAGE_BUCKET;
    
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

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

