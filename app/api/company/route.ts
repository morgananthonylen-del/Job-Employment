import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// GET all active company pages (public route)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    // If search query provided, filter by company name, description, or slug
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      // Fetch all active companies and filter in JavaScript for more reliable search
      const { data: allData, error: fetchError } = await supabaseAdmin
        .from("company_pages")
        .select("id, company_name, slug, company_description, company_logo_url")
        .eq("is_active", true)
        .order("company_name", { ascending: true });

      if (fetchError) {
        console.error("Supabase error:", fetchError);
        throw fetchError;
      }

      // Filter results that match the search term in any field
      const filteredData = (allData || []).filter((company) => {
        const name = (company.company_name || "").toLowerCase();
        const description = (company.company_description || "").toLowerCase();
        const slug = (company.slug || "").toLowerCase();
        return (
          name.includes(searchTerm) ||
          description.includes(searchTerm) ||
          slug.includes(searchTerm)
        );
      });

      console.log(`Found ${filteredData.length} company pages for search: "${search}"`);
      return NextResponse.json(filteredData);
    }

    // No search - return all active companies
    const { data, error } = await supabaseAdmin
      .from("company_pages")
      .select("id, company_name, slug, company_description, company_logo_url")
      .eq("is_active", true)
      .order("company_name", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} company pages`);
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("Error fetching company pages:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch company pages" },
      { status: 500 }
    );
  }
}
