import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "Heroe Slider Images";

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
      title,
      description,
      link_url,
      display_order,
      is_active,
    } = body;

    const updateData: any = {};
    if (image_url !== undefined) updateData.image_url = image_url;
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
    
    // First, get the image record to get the URL and extract file path
    const { data: imageData, error: fetchError } = await supabaseAdmin
      .from("slider_images")
      .select("image_url")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    if (!imageData) {
      return NextResponse.json(
        { error: "Slider image not found" },
        { status: 404 }
      );
    }

    // Extract file path from URL
    let filePath = "";
    try {
      const urlObj = new URL(imageData.image_url);
      const pathParts = urlObj.pathname.split("/");
      const bucketIndex = pathParts.findIndex(part => 
        decodeURIComponent(part).includes("Slider") || part.includes("Slider")
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

    // Delete from database first
    const { error: deleteError } = await supabaseAdmin
      .from("slider_images")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // Delete from storage bucket if we have the file path
    if (filePath) {
      console.log("Deleting file from bucket:", filePath);
      const { error: storageError } = await supabaseAdmin.storage
        .from(BUCKET)
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

    return NextResponse.json({ message: "Slider image deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting slider image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete slider image" },
      { status: 500 }
    );
  }
}

