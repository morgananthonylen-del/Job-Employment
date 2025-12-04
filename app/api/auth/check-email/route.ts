import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ exists: false });
    }

    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Email check error:", error);
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: Boolean(data) });
  } catch (error: any) {
    console.error("Email check route error:", error);
    return NextResponse.json({ exists: false });
  }
}





