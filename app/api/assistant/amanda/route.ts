import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser || authUser.userType !== "jobseeker") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { message, userContext } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Build context about FastLink and the user's dashboard
    const systemPrompt = `You are Amanda, a friendly and helpful AI assistant for FastLink, a job employment platform. You help job seekers navigate their dashboard and find opportunities.

Your role:
- Guide users to find jobs, track applications, manage documents, and update their profile
- Provide helpful, concise answers (2-3 sentences max)
- Be friendly, encouraging, and professional
- Always suggest relevant links when appropriate

Available sections:
- Dashboard: Overview of applications, jobs, and AI assistant
- Find Jobs: Browse and search for job opportunities
- Applications: Track submitted applications and their status
- Saved Jobs: Bookmarked jobs for later
- Documents: Upload and manage CV, birth certificate, references, cover letters
- Profile: Update personal information, contact details
- Settings: Account settings, password, preferences

${userContext ? `User context: ${userContext}` : ""}

When users ask about specific features, provide helpful guidance and suggest the relevant page. Keep responses conversational and supportive.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error", { status: response.status, error: errorText });
      let errorMessage = "Failed to get AI response";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage, details: errorText },
        { status: response.status >= 400 && response.status < 500 ? response.status : 500 }
      );
    }

    const body = await response.json();
    const content = body?.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: content.trim() });
  } catch (error: any) {
    console.error("Amanda API error:", error);
    const errorMessage = error?.message || error?.toString() || "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

