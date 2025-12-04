import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { message: "Verification token is required" },
        { status: 400 }
      );
    }

    // Find user by verification token
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("email_verification_token", token)
      .single();

    if (findError || !user) {
      return NextResponse.json(
        { message: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Update user to verified
    const { error: updateError } = await supabase
      .from("users")
      .update({
        is_email_verified: true,
        email_verification_token: null,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { message: "Error verifying email", error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Email verified successfully",
    });
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "Server error during verification", error: error.message },
      { status: 500 }
    );
  }
}

