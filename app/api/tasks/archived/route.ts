import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db"
import { validateSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get("clientId")
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || ""
    const session = await validateSession(token)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseAdminClient()
    const isAdmin = session.role === "admin" || session.role === "manager"

    let query = supabase
      .from("tasks")
      .select("id, title, status, archived_at, archived_by, client_id, assigned_to", { count: "exact" })
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Non-admins only see their own archived tasks
    if (!isAdmin) {
      query = query.eq("assigned_to", session.userId)
    }

    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    if (search) {
      query = query.ilike("title", `%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("[v0] Fetch archived error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[v0] Archived tasks endpoint error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
