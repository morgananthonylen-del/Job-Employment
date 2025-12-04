import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateAiSuggestionForApplication } from "@/lib/aiReview";

const TEXT_FILE_REGEX = /\.(txt|md|csv|json|log)$/i;
const PDF_FILE_REGEX = /\.pdf$/i;

async function fetchNextPendingDocument() {
  const { data: doc, error } = await supabaseAdmin
    .from("application_documents")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return doc;
}

async function markStatus(id: string, status: "processing" | "completed" | "failed", payload: Record<string, any>) {
  const { error } = await supabaseAdmin
    .from("application_documents")
    .update({
      status,
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw error;
  }
}

async function extractTextFromDocument(bucket: string, path: string) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
  if (error || !data) {
    throw error ?? new Error("Unable to download document");
  }

  const arrayBuffer = await data.arrayBuffer();
  const decoder = new TextDecoder();
  let extractedText = "";
  let notes: Record<string, unknown> = {};

  if (TEXT_FILE_REGEX.test(path)) {
    extractedText = decoder.decode(arrayBuffer);
    notes = { extraction_method: "plain_text" };
  } else if (PDF_FILE_REGEX.test(path)) {
    extractedText = "[PDF document detected. OCR extraction required.]";
    notes = { extraction_method: "pdf_stub" };
  } else {
    extractedText = "[Binary document format. Extraction pending external processor.]";
    notes = { extraction_method: "binary_stub" };
  }

  return { extractedText, metadata: notes };
}

export async function POST(request: NextRequest) {
  let document: any = null;
  try {
    const configuredSecret = process.env.DOCUMENT_PROCESSING_SECRET;
    if (configuredSecret) {
      const provided = request.headers.get("x-processing-secret");
      if (!provided || provided !== configuredSecret) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }

    document = await fetchNextPendingDocument();
    if (!document) {
      return NextResponse.json({ message: "No pending documents" }, { status: 200 });
    }

    await markStatus(document.id, "processing", {
      extracted_metadata: {
        ...(document.extracted_metadata || {}),
        processing_started_at: new Date().toISOString(),
      },
    });

    const { extractedText, metadata } = await extractTextFromDocument(
      document.storage_bucket,
      document.storage_path
    );

    await markStatus(document.id, "completed", {
      extracted_text: extractedText,
      extracted_metadata: {
        ...(document.extracted_metadata || {}),
        ...metadata,
        processing_completed_at: new Date().toISOString(),
      },
      extracted_at: new Date().toISOString(),
    });

    try {
      await generateAiSuggestionForApplication(document.application_id);
    } catch (aiError) {
      console.error("AI suggestion generation error:", aiError);
    }

    return NextResponse.json({
      message: "Document processed",
      documentId: document.id,
    });
  } catch (error: any) {
    console.error("Document processing failed:", error);
    if (document?.id) {
      await markStatus(document.id, "failed", {
        extracted_metadata: {
          ...(document.extracted_metadata || {}),
          failure_reason: error?.message || "Unknown error",
          failed_at: new Date().toISOString(),
        },
      }).catch((updateError) => {
        console.error("Failed to mark document as failed:", updateError);
      });
    }
    return NextResponse.json(
      { message: "Processing error", error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}


