import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET all active slider images (public route)
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from("slider_images")
      .select("*")
      .eq("is_active", true)
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

