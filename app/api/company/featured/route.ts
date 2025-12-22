import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET featured company pages (public route)
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("company_pages")
      .select("id, company_name, slug, company_description, company_logo_url, website")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("company_name", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Error fetching featured company pages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch featured company pages" },
      { status: 500 }
    );
  }
}

