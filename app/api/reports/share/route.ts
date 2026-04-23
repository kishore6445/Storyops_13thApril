import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// POST /api/reports/share — create a shareable link
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { dateFrom, dateTo, clientId, userId, title } = body

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: "dateFrom and dateTo are required" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from("report_shares")
      .insert({
        created_by: authResult.user.id,
        date_from: dateFrom,
        date_to: dateTo,
        client_id: clientId || null,
        user_id: userId || null,
        title: title || null,
      })
      .select("share_token")
      .single()

    if (error) {
      console.error("[v0] Create share error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ token: data.share_token })
  } catch (error) {
    console.error("[v0] Share route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/reports/share?token=xxx — resolve share token to params
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from("report_shares")
      .select("*")
      .eq("share_token", token)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 })
    }

    return NextResponse.json({ share: data })
  } catch (error) {
    console.error("[v0] Share GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
