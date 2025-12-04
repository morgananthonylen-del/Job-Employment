import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/emailService";

export async function GET(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, email, phone_number, name, company_name, company_logo_url, user_type, address, city, avatar_url, website, birthday, gender, ethnicity, additional_addresses, years_of_experience"
      )
      .eq("id", authUser.userId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      currentPassword,
      newPassword,
      email,
      phoneNumber,
      name,
      companyName,
      address,
      additionalAddresses,
      city,
      avatarUrl,
      companyLogoUrl,
      website,
      birthday,
      gender,
      ethnicity,
    } = body;

    // Get current user
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.userId)
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: "Current password is required to change password" },
          { status: 400 }
        );
      }

      // Verify current password
      if (!user.password_hash) {
        return NextResponse.json(
          { message: "Account error. Please contact support." },
          { status: 500 }
        );
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isMatch) {
        return NextResponse.json(
          { message: "Current password is incorrect" },
          { status: 401 }
        );
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(newPassword, salt);
    }

    // Update email if provided
    if (email && email !== user.email) {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase())
        .neq("id", authUser.userId)
        .maybeSingle();

      if (existingUser) {
        return NextResponse.json(
          { message: "Email already in use" },
          { status: 400 }
        );
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      updateData.email = email.toLowerCase();
      updateData.is_email_verified = false;
      updateData.email_verification_token = verificationToken;

      // Send verification email
      try {
        await sendVerificationEmail(email, verificationToken);
      } catch (emailError) {
        console.error("Email error:", emailError);
        // Continue with update even if email fails
      }
    }

    // Update phone number if provided
    if (phoneNumber !== undefined) {
      updateData.phone_number = phoneNumber;
    }

    // Update name if provided
    if (name !== undefined && name !== user.name) {
      updateData.name = name;
    }

    // Update company name if provided (for business users)
    if (companyName !== undefined && companyName !== user.company_name) {
      updateData.company_name = companyName;
    }

    // Update address if provided
    if (address !== undefined) {
      updateData.address = address;
    }

    // Update city if provided
    if (city !== undefined) {
      updateData.city = city;
    }

    if (Array.isArray(additionalAddresses)) {
      updateData.additional_addresses = additionalAddresses.filter(
        (value) => typeof value === "string" && value.trim().length > 0
      );
    }

    if (website !== undefined) {
      updateData.website = website || null;
    }

    if (avatarUrl !== undefined) {
      updateData.avatar_url = avatarUrl || null;
    }

    if (companyLogoUrl !== undefined) {
      updateData.company_logo_url = companyLogoUrl || null;
    }

    if (birthday !== undefined) {
      updateData.birthday = birthday || null;
    }

    if (gender !== undefined) {
      updateData.gender = gender || null;
    }

    if (ethnicity !== undefined) {
      updateData.ethnicity = ethnicity || null;
    }

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      phone_number: user.phone_number,
      name: user.name,
      company_name: user.company_name,
      company_logo_url: user.company_logo_url,
      user_type: user.user_type,
      is_email_verified: user.is_email_verified,
      address: user.address,
      additional_addresses: user.additional_addresses,
      city: user.city,
      avatar_url: user.avatar_url,
      website: user.website,
      birthday: user.birthday,
      gender: user.gender,
      ethnicity: user.ethnicity,
    };

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        message: "No changes detected",
        user: sanitizedUser,
        emailChanged: false,
      });
    }

    // Update user
    const { data: updated, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", authUser.userId)
      .select(
        "id, email, phone_number, name, company_name, company_logo_url, user_type, is_email_verified, address, additional_addresses, city, avatar_url, website, birthday, gender, ethnicity, years_of_experience"
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        { message: "Error updating profile", error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updated,
      emailChanged: email && email !== user.email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", authUser.userId);

    if (error) {
      return NextResponse.json(
        { message: "Error deleting account", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

