import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    threadId: string;
    messageId: string;
  }>;
};

// PUT - Update a message (edit)
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser || authUser.userType !== "business") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { threadId, messageId } = await context.params;
    const { body } = await request.json();

    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json(
        { error: "Message body is required" },
        { status: 400 }
      );
    }

    // Verify the thread belongs to this business
    const { data: thread, error: threadError } = await supabaseAdmin
      .from("job_post_threads")
      .select("id, business_id")
      .eq("id", threadId)
      .eq("business_id", authUser.userId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    // Get the message and verify ownership and time limit
    const { data: message, error: messageError } = await supabaseAdmin
      .from("job_post_messages")
      .select("id, sender_id, sender_type, created_at")
      .eq("id", messageId)
      .eq("thread_id", threadId)
      .single();

    if (messageError || !message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    // Verify message belongs to this business
    if (message.sender_id !== authUser.userId || message.sender_type !== "business") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if message is within 2 minutes
    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds

    if (now - messageTime > twoMinutes) {
      return NextResponse.json(
        { error: "Message can only be edited within 2 minutes of sending" },
        { status: 403 }
      );
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabaseAdmin
      .from("job_post_messages")
      .update({
        body: body.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating message:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedMessage);
  } catch (error: any) {
    console.error("Error in PUT messages route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}





