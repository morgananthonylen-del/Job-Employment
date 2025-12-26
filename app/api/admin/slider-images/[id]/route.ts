import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const IMAGE_BUCKET = "Heroe Slider Images";
const VIDEO_BUCKET = "video";

// GET single slider image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("slider_images")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Slider image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching slider image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch slider image" },
      { status: 500 }
    );
  }
}

// PUT update slider image
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      image_url,
      video_url,
      media_type,
      title,
      description,
      link_url,
      display_order,
      is_active,
    } = body;

    const updateData: any = {};
    if (image_url !== undefined) updateData.image_url = image_url;
    if (video_url !== undefined) updateData.video_url = video_url;
    if (media_type !== undefined) updateData.media_type = media_type;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (link_url !== undefined) updateData.link_url = link_url;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from("slider_images")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Slider image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error updating slider image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update slider image" },
      { status: 500 }
    );
  }
}

// DELETE slider image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // First, get the media record to get the URL and extract file path
    // Try to select with new columns first, fallback to just image_url if columns don't exist
    let mediaData: any;
    let fetchError: any;
    
    // Try with new columns first
    const { data: newData, error: newError } = await supabaseAdmin
      .from("slider_images")
      .select("image_url, video_url, media_type")
      .eq("id", id)
      .single();
    
    if (newError && (newError.message?.includes("video_url") || newError.message?.includes("media_type") || newError.code === "42703")) {
      // Columns don't exist, fallback to just image_url
      console.log("New columns don't exist, using fallback query");
      const { data: fallbackData, error: fallbackError } = await supabaseAdmin
        .from("slider_images")
        .select("image_url")
        .eq("id", id)
        .single();
      
      mediaData = fallbackData;
      fetchError = fallbackError;
    } else {
      mediaData = newData;
      fetchError = newError;
    }

    if (fetchError) throw fetchError;

    if (!mediaData) {
      return NextResponse.json(
        { error: "Hero area media not found" },
        { status: 404 }
      );
    }

    // Extract file path from URL (use video_url if media_type is video, otherwise image_url)
    const mediaUrl = (mediaData.media_type === "video" && mediaData.video_url) ? mediaData.video_url : mediaData.image_url;
    let filePath = "";
    let bucket = IMAGE_BUCKET;
    
    if (mediaData.media_type === "video" && mediaData.video_url) {
      bucket = VIDEO_BUCKET;
    }

    if (mediaUrl) {
      try {
        const urlObj = new URL(mediaUrl);
        const pathParts = urlObj.pathname.split("/");
        
        // Try to find the bucket name in the path
        const bucketIndex = pathParts.findIndex(part => 
          decodeURIComponent(part).includes("Slider") || 
          part.includes("Slider") ||
          decodeURIComponent(part).toLowerCase() === "video" ||
          part.toLowerCase() === "video"
        );
        
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          // Get everything after the bucket name
          filePath = pathParts.slice(bucketIndex + 1).join("/");
          filePath = decodeURIComponent(filePath);
        } else {
          // Fallback: try to extract hero-slides path
          const match = urlObj.pathname.match(/hero-slides\/.+$/);
          if (match) {
            filePath = decodeURIComponent(match[0]);
          }
        }
      } catch (urlError) {
        console.error("Error parsing URL:", urlError);
      }
    }

    // Delete from database first
    const { error: deleteError } = await supabaseAdmin
      .from("slider_images")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // Delete from storage bucket if we have the file path
    if (filePath) {
      console.log(`Deleting file from ${bucket} bucket:`, filePath);
      const { error: storageError } = await supabaseAdmin.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) {
        console.error("Error deleting from storage (continuing anyway):", storageError);
        // Don't fail the request if storage delete fails - the DB record is already deleted
      } else {
        console.log("Successfully deleted file from storage");
      }
    } else {
      console.warn("Could not extract file path from URL, skipping storage deletion");
    }

    return NextResponse.json({ message: "Hero area media deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting slider image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete slider image" },
      { status: 500 }
    );
  }
}

