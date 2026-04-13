import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { getSupabaseAdminClient, getSupabaseClient, getUserByEmail } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error("[v0] Supabase Auth login error:", authError);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Get user from custom users table.
    // Prefer admin client in server routes to avoid RLS issues in production.
    let user: any = null;
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      const { data } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      user = data;
    } catch (adminError) {
      console.warn("[v0] Admin users lookup failed, falling back to anon client", adminError);
      user = await getUserByEmail(email);
    }

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 401 }
      );
    }

    // Create session token
    const sessionToken = await createSession(user.id, user.role);

    // Return session token in response body (cookie method not working in dev)
    const response = NextResponse.json({
      success: true,
      sessionToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });

    console.log('[v0] Login successful - Returning session token')

    return response;
  } catch (error) {
    console.error("[v0] Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
