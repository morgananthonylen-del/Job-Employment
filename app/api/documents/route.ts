import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "documents";
const CATEGORIES = ["birth_certificate", "cv", "reference", "application_letter", "degree_diploma_certificate"] as const;
type Category = typeof CATEGORIES[number];

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { message: "Supabase storage is not configured" },
        { status: 500 }
      );
    }

    const prefixRoot = `user-documents/${authUser.userId}`;
    const documents: Array<{
      id: string;
      path: string;
      url: string;
      category: Category;
      name: string;
      uploaded_at: string;
    }> = [];

    for (const category of CATEGORIES) {
      const prefix = `${prefixRoot}/${category}`;
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .list(prefix, {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) {
        console.error(`List documents error for ${category}:`, error);
        continue;
      }

      (data || []).forEach((item) => {
        if (!item.name) return;
        const path = `${prefix}/${item.name}`;
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

        documents.push({
          id: path,
          path,
          url: publicUrl,
          category,
          name: item.name,
          uploaded_at: item.created_at || new Date().toISOString(),
        });
      });
    }

    documents.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error("Documents fetch error:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

