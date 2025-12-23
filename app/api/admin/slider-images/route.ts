import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "Heroe Slider Images";

// Sync images from bucket to database
async function syncImagesFromBucket() {
  try {
    console.log("Syncing images from bucket to database...");
    
    // List all files in the bucket
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(BUCKET)
      .list("hero-slides", {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (listError) {
      console.error("Error listing bucket files:", listError);
      return;
    }

    if (!files || files.length === 0) {
      console.log("No files found in bucket");
      return;
    }

    console.log(`Found ${files.length} files in bucket`);

    // Get existing database records
    const { data: existingRecords } = await supabaseAdmin
      .from("slider_images")
      .select("image_url");

    const existingUrls = new Set(
      (existingRecords || []).map((r) => r.image_url)
    );

    // For each file, create a database record if it doesn't exist
    let syncedCount = 0;
    for (const file of files) {
      if (!file.name) continue;

      const filePath = `hero-slides/${file.name}`;
      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);

      // Skip if already in database
      if (existingUrls.has(publicUrl)) {
        continue;
      }

      // Insert into database (default to 'home' for synced images)
      const { error: insertError } = await supabaseAdmin
        .from("slider_images")
        .insert({
          image_url: publicUrl,
          title: null,
          description: null,
          link_url: null,
          display_order: 0,
          is_active: true,
          page_name: "home",
        });

      if (insertError) {
        console.error(`Error syncing ${file.name}:`, insertError);
      } else {
        syncedCount++;
        console.log(`Synced ${file.name} to database`);
      }
    }

    console.log(`Synced ${syncedCount} new images to database`);
  } catch (error) {
    console.error("Error syncing images:", error);
  }
}

// GET all slider images
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sync = searchParams.get("sync") === "true";

    // Optionally sync from bucket first
    if (sync) {
      await syncImagesFromBucket();
    }

    console.log("Fetching all slider images from database (no page filter)...");
    
    const { data, error } = await supabaseAdmin
      .from("slider_images")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      // Check if table doesn't exist
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return NextResponse.json(
          { 
            error: "The slider_images table does not exist. Please run the migration: supabase/migrations/20250121_add_slider_images.sql"
          },
          { status: 500 }
        );
      }
      throw error;
    }

    console.log("Fetched slider images:", data?.length || 0, "images");
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
    console.log("POST /api/admin/slider-images - Request body:", body);
    
    const {
      image_url,
      title,
      description,
      link_url,
      display_order = 0,
      is_active = true,
      page_name = "home",
    } = body;

    if (!image_url) {
      console.error("Missing image_url in request");
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    console.log(`Inserting slider image into database with page_name: ${page_name || "home"}...`);
    const insertData = {
      image_url,
      title: title || null,
      description: description || null,
      link_url: link_url || null,
      display_order,
      is_active,
      page_name: page_name || "home",
    };
    console.log("Insert data:", insertData);
    
    const { data, error } = await supabaseAdmin
      .from("slider_images")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Database insert error:", error);
      // If page_name column doesn't exist, try without it
      if (error.message?.includes("page_name") || error.code === "42703") {
        console.warn("page_name column doesn't exist, inserting without it");
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
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
        
        if (fallbackError) throw fallbackError;
        console.log("Successfully created slider image (without page_name):", fallbackData);
        return NextResponse.json(fallbackData, { status: 201 });
      }
      throw error;
    }

    console.log("Successfully created slider image with page_name:", data);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("Error creating slider image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create slider image" },
      { status: 500 }
    );
  }
}

