import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { unstable_cache } from "next/cache";

// Cache slider images for 5 minutes to improve performance
const getCachedSliderImages = unstable_cache(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("slider_images")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  },
  ['slider-images'],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ['slider-images']
  }
);

// GET all active slider images (public route)
export async function GET(request: NextRequest) {
  try {
    const activeImages = await getCachedSliderImages();

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

