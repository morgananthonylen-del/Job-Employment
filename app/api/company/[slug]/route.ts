import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET company page by slug (public route)
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("company_pages")
      .select("*")
      .eq("slug", params.slug.toLowerCase())
      .eq("is_active", true)
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Company page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error fetching company page:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch company page" },
      { status: 500 }
    );
  }
}

