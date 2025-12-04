import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { identifier, email, password, expectedRole } = await request.json();
    const loginId = (identifier ?? email ?? "").trim();

    if (!loginId || !password) {
      return NextResponse.json(
        { message: "Email/phone and password are required" },
        { status: 400 }
      );
    }

    let user: any = null;
    let queryError: any = null;

    if (loginId.includes("@")) {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", loginId.toLowerCase())
        .maybeSingle();
      user = data;
      queryError = error;
    } else {
      const phoneCandidates = [loginId, loginId.replace(/\D/g, "")].filter(Boolean);
      for (const phone of phoneCandidates) {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("phone_number", phone)
          .maybeSingle();
        if (error) {
          queryError = error;
          continue;
        }
        if (data) {
          user = data;
          break;
        }
      }
    }

    if (queryError) {
      console.error("Supabase error:", queryError);
      return NextResponse.json(
        { message: "Database error. Please try again." },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check password FIRST (before other checks) to avoid revealing account status
    if (!user.password_hash) {
      console.error("User has no password hash:", user.id);
      return NextResponse.json(
        { message: "Invalid credentials", error: "ACCOUNT_ERROR" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials", error: "INVALID_CREDENTIALS" },
        { status: 401 }
      );
    }

    // Check if banned (after password check)
    if (user.is_banned) {
      return NextResponse.json(
        { message: "Your account has been banned. Please contact support.", error: "ACCOUNT_BANNED" },
        { status: 403 }
      );
    }

    // Check email verification (after password check)
    if (!user.is_email_verified) {
      return NextResponse.json(
        { message: "Please verify your email address first", error: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    // Check role match if expectedRole is provided
    if (expectedRole && user.user_type !== expectedRole) {
      const roleMessages: Record<string, string> = {
        jobseeker: "This account is registered as a company. Please use the company login page.",
        business: "This account is registered as a job seeker. Please use the job seeker login page.",
      };
      
      return NextResponse.json(
        { 
          message: roleMessages[expectedRole] || "Account type mismatch. Please use the correct login page.",
          error: "ROLE_MISMATCH",
          actualRole: user.user_type,
          expectedRole: expectedRole,
        },
        { status: 403 }
      );
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, userType: user.user_type },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        userType: user.user_type,
        email: user.email,
        name: user.name || user.company_name || "",
        company_name: user.company_name || "",
        isEmailVerified: user.is_email_verified,
        avatar_url: user.avatar_url || "",
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Server error during login. Please try again.", error: error.message || "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }
}

