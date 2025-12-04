import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (findError && findError.code !== "PGRST116") {
      console.error("Supabase error:", findError);
      return NextResponse.json(
        { message: "Error finding user", error: findError.message },
        { status: 500 }
      );
    }

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { message: "If an account exists with this email, a verification link has been sent." },
        { status: 200 }
      );
    }

    // Check if already verified
    if (user.is_email_verified) {
      return NextResponse.json(
        { message: "Your email is already verified. You can log in now." },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Update user with new token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        email_verification_token: verificationToken,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { message: "Error updating verification token", error: updateError.message },
        { status: 500 }
      );
    }

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken);
      return NextResponse.json({
        message: "Verification email has been resent. Please check your inbox.",
      });
    } catch (emailError: any) {
      console.error("Email error:", emailError);
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email/${verificationToken}`;
      
      // Log verification URL for manual testing
      console.error("Manual verification URL:", verificationUrl);
      console.error("Email configuration issue. User can verify manually using the URL above.");
      
      // Check if it's a configuration error
      if (emailError.message?.includes("not configured")) {
        return NextResponse.json(
          { 
            message: "Email service is not configured. Your account was created successfully. Please check the server console for your verification link, or contact support.",
            error: "EMAIL_NOT_CONFIGURED",
            verificationUrl: verificationUrl, // Include URL so user can verify manually
            manualVerification: true
          },
          { status: 200 } // Return 200 so user knows account exists, but email failed
        );
      }
      
      // For other email errors, still provide the verification URL
      return NextResponse.json(
        { 
          message: "We couldn't send the email, but your account was created. You can verify your email using the link below, or try again later.",
          error: emailError.message,
          verificationUrl: verificationUrl,
          manualVerification: true
        },
        { status: 200 } // Return 200 with manual verification option
      );
    }
  } catch (error: any) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

