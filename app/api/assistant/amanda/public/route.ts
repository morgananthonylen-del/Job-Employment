import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { message, userName, userEmail } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Build context about FastLink for public/home page users
    const userInfo = userName ? `User's name: ${userName}${userEmail ? `, Email: ${userEmail}` : ""}` : "";
    
    const systemPrompt = `You are Amanda, a friendly and helpful female AI assistant for FastLink, a job employment platform that connects businesses with talented job seekers.

Your role:
- Help visitors understand what FastLink offers
- Guide them to sign up as either a job seeker or business
- Provide helpful, detailed explanations when asked
- Be friendly, encouraging, and professional
- Use a warm, conversational tone
${userInfo ? `- The user's name is ${userName}. Use their name naturally in conversation.` : ""}

About FastLink:
- FastLink helps job seekers find opportunities and helps businesses find talent
- Job seekers can browse jobs, apply, track applications, and manage documents
- Businesses can post jobs, review applications, and connect with candidates
- The platform offers both free and Pro tier job postings
- Job seekers can sign up at /register/jobseeker
- Businesses can sign up at /register/business

When users ask about signing up or getting started, guide them to the registration pages. Be helpful and encouraging!`;

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

