import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

type UserType = "jobseeker" | "business" | "admin";

function buildToken(user: any) {
  return jwt.sign(
    { userId: user.id, userType: user.user_type },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "7d" }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { email, fullName, userType = "auto", intent = "login" } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Google account did not return an email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const trimmedName = (fullName || "").trim();

    const { data: existingUser, error: selectError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (selectError) {
      console.error("Supabase select error:", selectError);
      return NextResponse.json(
        { message: "Database error while verifying account." },
        { status: 500 }
      );
    }

    if (existingUser) {
      if (existingUser.is_banned) {
        return NextResponse.json(
          { message: "Your account has been banned. Please contact support." },
          { status: 403 }
        );
      }

      if (!existingUser.is_email_verified) {
        await supabaseAdmin
          .from("users")
          .update({ is_email_verified: true })
          .eq("id", existingUser.id);
      }

      const token = buildToken(existingUser);
      return NextResponse.json({
        token,
        user: {
          id: existingUser.id,
          userType: existingUser.user_type as UserType,
          email: existingUser.email,
          name: existingUser.name || existingUser.company_name || "",
          company_name: existingUser.company_name || "",
          isEmailVerified: true,
          avatar_url: existingUser.avatar_url || "",
        },
      });
    }

    if (intent === "login" && (!userType || userType === "auto")) {
      return NextResponse.json(
        {
          message:
            "No FastLink account found for this Google email. Please sign up first or use your email and password.",
        },
        { status: 404 }
      );
    }

    const resolvedUserType: UserType =
      userType === "business" ? "business" : "jobseeker";

    const randomPassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const insertPayload: any = {
      email: normalizedEmail,
      password_hash: passwordHash,
      user_type: resolvedUserType,
      is_email_verified: true,
      is_banned: false,
    };

    if (resolvedUserType === "business") {
      insertPayload.company_name =
        trimmedName || "Google Business User";
      insertPayload.name = trimmedName || "";
    } else {
      insertPayload.name = trimmedName || "";
    }

    const { data: insertedUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert(insertPayload)
      .select("*")
      .single();

    if (insertError || !insertedUser) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { message: "Failed to create account from Google profile." },
        { status: 500 }
      );
    }

    const token = buildToken(insertedUser);

    return NextResponse.json({
      token,
      user: {
        id: insertedUser.id,
        userType: insertedUser.user_type as UserType,
        email: insertedUser.email,
        name: insertedUser.name || insertedUser.company_name || "",
        company_name: insertedUser.company_name || "",
        isEmailVerified: true,
        avatar_url: insertedUser.avatar_url || "",
      },
    });
  } catch (error: any) {
    console.error("Google OAuth handler error:", error);
    return NextResponse.json(
      { message: error?.message || "Unexpected error during Google authentication." },
      { status: 500 }
    );
  }
}











