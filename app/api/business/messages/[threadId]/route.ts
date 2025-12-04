import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    threadId: string;
  }>;
};

// GET messages for a thread
export async function GET(
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

    const { threadId } = await context.params;

    // Verify the thread belongs to this business
    const { data: thread, error: threadError } = await supabase
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

    // Get all messages for this thread
    const { data: messages, error: messagesError } = await supabase
      .from("job_post_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return NextResponse.json(
        { error: messagesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(messages || []);
  } catch (error: any) {
    console.error("Error in messages route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST a new message to a thread
export async function POST(
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

    const { threadId } = await context.params;
    const { body } = await request.json();

    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json(
        { error: "Message body is required" },
        { status: 400 }
      );
    }

    // Verify the thread belongs to this business
    const { data: thread, error: threadError } = await supabase
      .from("job_post_threads")
      .select("id, business_id, job_id")
      .eq("id", threadId)
      .eq("business_id", authUser.userId)
      .single();

    if (threadError || !thread) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      );
    }

    // Verify the job allows messaging (must be Pro tier)
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, promotion_tier, contact_preference")
      .eq("id", thread.job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.promotion_tier !== "pro") {
      return NextResponse.json(
        { error: "Messaging is only available for Pro job posts" },
        { status: 403 }
      );
    }

    // Create the message
    const { data: message, error: messageError } = await supabase
      .from("job_post_messages")
      .insert({
        thread_id: threadId,
        sender_id: authUser.userId,
        sender_type: "business",
        body: body.trim(),
      })
      .select()
      .single();

    if (messageError) {
      console.error("Error creating message:", messageError);
      return NextResponse.json(
        { error: messageError.message },
        { status: 500 }
      );
    }

    // Update thread's last_message_at to ensure conversation appears in list
    // (Trigger should handle this, but doing it manually as a safety measure)
    const { error: updateThreadError } = await supabase
      .from("job_post_threads")
      .update({ 
        last_message_at: message.created_at,
        updated_at: new Date().toISOString()
      })
      .eq("id", threadId);

    if (updateThreadError) {
      console.error("Error updating thread last_message_at:", updateThreadError);
      // Don't fail the request if this update fails, message was already created
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST messages route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

