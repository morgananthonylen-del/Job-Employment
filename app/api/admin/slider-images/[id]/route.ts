import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET single slider image
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("slider_images")
      .select("*")
      .eq("id", params.id)
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
  { params }: { params: { id: string } }
) {
  try {
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
      .eq("id", params.id)
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
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from("slider_images")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ message: "Slider image deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting slider image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete slider image" },
      { status: 500 }
    );
  }
}

