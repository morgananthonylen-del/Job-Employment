import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET all slider images
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from("slider_images")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Error fetching slider images:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch slider images" },
      { status: 500 }
    );
  }
}

// POST create new slider image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      image_url,
      title,
      description,
      link_url,
      display_order = 0,
      is_active = true,
    } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("slider_images")
      .insert({
        image_url,
        title: title || null,
        description: description || null,
        link_url: link_url || null,
        display_order,
        is_active,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("Error creating slider image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create slider image" },
      { status: 500 }
    );
  }
}

