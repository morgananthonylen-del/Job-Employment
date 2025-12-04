import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/emailService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phoneNumber, password } = body;

    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPhone = String(phoneNumber || "").replace(/\D/g, "");

    if (!normalizedName || !normalizedEmail || !password || normalizedPhone.length < 5) {
      return NextResponse.json(
        { message: "All required fields must be filled" },
        { status: 400 }
      );
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return NextResponse.json({ message: "Invalid email address" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: "Password too short" }, { status: 400 });
    }

    try {
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Supabase check error:", checkError);
        return NextResponse.json({ message: "Error checking user" }, { status: 500 });
      }

      if (existingUser) {
        return NextResponse.json({ message: "User already exists" }, { status: 400 });
      }
    } catch (error: any) {
      console.warn("Could not verify email uniqueness:", error.message);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const { data: user, error } = await supabase
      .from("users")
      .insert({
        user_type: "jobseeker",
        email: normalizedEmail,
        password_hash: passwordHash,
        name: normalizedName,
        phone_number: normalizedPhone,
        email_verification_token: verificationToken,
        is_email_verified: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ message: "Error creating user" }, { status: 500 });
    }

    let emailSent = false;
    let emailError: any = null;
    try {
      emailSent = await sendVerificationEmail(normalizedEmail, verificationToken);
    } catch (err: any) {
      emailError = err;
      console.error("Email error:", err);
    }

    const response: any = {
      message: emailSent
        ? "Registration successful. Please check your email to verify your account."
        : "Registration successful! However, we couldn't send the verification email. Please use the resend verification feature.",
      userId: user.id,
    };

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

