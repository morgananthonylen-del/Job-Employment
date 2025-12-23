import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { unstable_cache } from "next/cache";

// GET all active slider images (public route)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page"); // optional, only used when provided

    // Base query: all active images
    let query = supabaseAdmin
      .from("slider_images")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    // Optionally filter by page_name if page is provided
    if (page) {
      console.log(`[API] Fetching slider images for page: ${page}`);
      query = query.eq("page_name", page);
    } else {
      console.log("[API] Fetching slider images for all pages (no page filter)");
    }

    const { data, error } = await query;
    
    console.log(`[API] Query result - data: ${data?.length || 0} images, error:`, error);
    
    if (error) {
      // If page_name column doesn't exist, fall back to showing all images for home page only
      if (error.message?.includes("page_name") || error.code === "42703") {
        console.warn("page_name column not found, showing all images for home page");
        if (page === "home") {
          const { data: allData, error: allError } = await supabaseAdmin
            .from("slider_images")
            .select("*")
            .eq("is_active", true)
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: false });
          
          if (allError) throw allError;
          const activeImages = allData || [];
          
          const response = NextResponse.json(activeImages);
          response.headers.set(
            'Cache-Control',
            'public, s-maxage=300, stale-while-revalidate=600'
          );
          return response;
        } else {
          // For other pages, return empty array if column doesn't exist
          return NextResponse.json([]);
        }
      }
      throw error;
    }

    const activeImages = data || [];

    const response = NextResponse.json(activeImages);
    
    // Add cache headers for browser caching
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );

    return response;
  } catch (error: any) {
    console.error("Error fetching slider images:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch slider images" },
      { status: 500 }
    );
  }
}

