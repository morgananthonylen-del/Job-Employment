import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "documents";

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("file");
    const category = (formData.get("category") as string) || "general";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ message: "File is required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const filePath = `user-documents/${authUser.userId}/${category}/${Date.now()}-${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Document upload error:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload document", error: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl, path: filePath });
  } catch (error: any) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ message: "Document path is required" }, { status: 400 });
    }

    const { error: removeError } = await supabaseAdmin.storage
      .from(BUCKET)
      .remove([path]);

    if (removeError) {
      console.error("Document deletion error:", removeError);
      return NextResponse.json(
        { message: "Failed to delete document", error: removeError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Document deleted" });
  } catch (error: any) {
    console.error("Document delete error:", error);
    return NextResponse.json(
      { message: error.message || "Server error" },
      { status: 500 }
    );
  }
}









