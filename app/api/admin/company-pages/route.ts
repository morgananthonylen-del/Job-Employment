import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET all company pages
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from("company_pages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Error fetching company pages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch company pages" },
      { status: 500 }
    );
  }
}

// POST create new company page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      company_name,
      slug,
      contact_email,
      contact_phone,
      contact_address,
      website,
      company_logo_url,
      company_description,
      meta_title,
      meta_description,
      meta_keywords,
      og_image_url,
      is_active = true,
      is_featured = false,
    } = body;

    // Validate required fields
    if (!company_name || !slug) {
      return NextResponse.json(
        { error: "Company name and slug are required" },
        { status: 400 }
      );
    }

    // Validate slug format (alphanumeric and hyphens only)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug.toLowerCase())) {
      return NextResponse.json(
        { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("company_pages")
      .insert({
        company_name,
        slug: slug.toLowerCase(),
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        contact_address: contact_address || null,
        website: website || null,
        company_logo_url: company_logo_url || null,
        company_description: company_description || null,
        meta_title: meta_title || null,
        meta_description: meta_description || null,
        meta_keywords: meta_keywords || null,
        og_image_url: og_image_url || null,
        is_active,
        is_featured: is_featured ?? false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { error: "A company page with this slug already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("Error creating company page:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create company page" },
      { status: 500 }
    );
  }
}

