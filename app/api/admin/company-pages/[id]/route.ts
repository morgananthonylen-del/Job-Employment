import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET single company page
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from("company_pages")
      .select("*")
      .eq("id", params.id)
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

// PUT update company page
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      is_active,
      is_featured,
    } = body;

    // Validate slug format if provided
    if (slug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(slug.toLowerCase())) {
        return NextResponse.json(
          { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (company_name !== undefined) updateData.company_name = company_name;
    if (slug !== undefined) updateData.slug = slug.toLowerCase();
    if (contact_email !== undefined) updateData.contact_email = contact_email;
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
    if (contact_address !== undefined) updateData.contact_address = contact_address;
    if (website !== undefined) updateData.website = website;
    if (company_logo_url !== undefined) updateData.company_logo_url = company_logo_url;
    if (company_description !== undefined) updateData.company_description = company_description;
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords;
    if (og_image_url !== undefined) updateData.og_image_url = og_image_url;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_featured !== undefined) updateData.is_featured = is_featured;

    const { data, error } = await supabaseAdmin
      .from("company_pages")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A company page with this slug already exists" },
          { status: 409 }
        );
      }
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: "Company page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error updating company page:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update company page" },
      { status: 500 }
    );
  }
}

// DELETE company page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabaseAdmin
      .from("company_pages")
      .delete()
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ message: "Company page deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting company page:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete company page" },
      { status: 500 }
    );
  }
}

