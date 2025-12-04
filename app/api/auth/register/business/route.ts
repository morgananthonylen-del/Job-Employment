import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name: rawName,
      email,
      password,
      phoneNumber: rawPhoneNumber,
      companyName,
    } = body;

    const name = rawName && String(rawName).trim().length > 0 ? rawName : companyName;
    const phoneNumber = rawPhoneNumber && String(rawPhoneNumber).trim().length > 0 ? rawPhoneNumber : null;

    // Validate required fields
    if (!companyName || !email || !password) {
      return NextResponse.json(
        { message: "Company name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      // Only treat as error if it's a real database error (not "not found")
      // PGRST116 = no rows returned (which is fine, means user doesn't exist)
      if (checkError && checkError.code !== "PGRST116") {
        // If it's a table doesn't exist error or connection error, log but continue
        // This allows the app to work even if Supabase isn't fully configured
        if (checkError.code === "42P01" || checkError.message?.includes("relation") || checkError.message?.includes("does not exist")) {
          console.warn("Supabase table may not exist yet:", checkError.message);
          // Continue with registration - table will be created or this will fail later
        } else {
          console.error("Supabase check error:", checkError);
          return NextResponse.json(
            { message: "Error checking user existence", error: checkError.message },
            { status: 500 }
          );
        }
      }

      if (existingUser) {
        return NextResponse.json(
          { message: "User already exists" },
          { status: 400 }
        );
      }
    } catch (error: any) {
      // If Supabase client itself fails (not configured), log and continue
      // The insert will fail later with a clearer error
      console.warn("Could not check user existence (Supabase may not be configured):", error.message);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Create user
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        user_type: "business",
        email: email.toLowerCase(),
        password_hash: passwordHash,
        name,
        company_name: companyName,
        email_verification_token: verificationToken,
        is_email_verified: false,
        phone_number: phoneNumber,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { message: "Error creating user", error: error.message },
        { status: 500 }
      );
    }

    // Send verification email
    let emailSent = false;
    let emailError: any = null;
    try {
      emailSent = await sendVerificationEmail(email, verificationToken);
    } catch (err: any) {
      emailError = err;
      console.error("Email error:", err);
      // Log the verification URL for manual testing if email fails
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email/${verificationToken}`;
      console.error("Manual verification URL:", verificationUrl);
      console.warn("Email verification was not sent. User can use resend verification feature or the URL above.");
    }

    // Return success even if email fails, but include info about email status
    const response: any = {
      message: emailSent
        ? "Registration successful. Please check your email to verify your account."
        : "Registration successful! However, we couldn't send the verification email. Please use the resend verification feature.",
      userId: user.id,
    };

    // If email failed, include verification URL for manual verification
    if (!emailSent && emailError) {
      response.emailFailed = true;
      response.verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email/${verificationToken}`;
      response.emailError = emailError.message?.includes("not configured")
        ? "EMAIL_NOT_CONFIGURED"
        : "EMAIL_SEND_FAILED";
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Server error during registration", error: error.message },
      { status: 500 }
    );
  }
}

