import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getSupabaseAdminClient } from "@/lib/db"

// GET /api/content/buckets?month=april&year=2026&clientId=...
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const clientId = searchParams.get("clientId")

    const supabase = getSupabaseAdminClient()

    let query = supabase
      .from("content_buckets")
      .select("*, clients(name), users!content_buckets_owner_id_fkey(full_name)")
      .order("platform", { ascending: true })
      .order("content_type", { ascending: true })

    if (month) query = query.eq("planning_month", month)
    if (year) query = query.eq("planning_year", parseInt(year))
    if (clientId) query = query.eq("client_id", clientId)

    const { data, error } = await query
    if (error) {
      console.error("[v0] Buckets GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const buckets = (data || []).map((row: any) => ({
      id: row.id,
      clientId: row.client_id,
      clientName: row.clients?.name || "",
      month: row.planning_month,
      year: row.planning_year,
      platform: row.platform,
      contentType: row.content_type,
      ownerId: row.owner_id,
      ownerName: row.users?.full_name || "",
      target: row.target,
      productionDone: row.production_done,
      scheduled: row.scheduled,
      published: row.published,
      notes: row.notes,
    }))

    return NextResponse.json({ buckets })
  } catch (err) {
    console.error("[v0] Buckets GET exception:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/content/buckets — bulk upsert from monthly planner
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { clientId, month, year, items, notes } = body
    // items: Array<{ platform: string, contentType: string, target: number }>

    if (!clientId || !month || !year || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    const rows = items.map((item: any) => ({
      client_id: clientId,
      planning_month: month,
      planning_year: parseInt(year),
      platform: item.platform,
      content_type: item.contentType,
      target: item.target,
      production_done: 0,
      scheduled: 0,
      published: 0,
      notes: notes || null,
      created_by: user.id,
    }))

    const { data, error } = await supabase
      .from("content_buckets")
      .upsert(rows, {
        onConflict: "client_id,planning_month,planning_year,platform,content_type",
        ignoreDuplicates: false,
      })
      .select("id")

    if (error) {
      console.error("[v0] Buckets POST error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, created: data?.length || 0 }, { status: 201 })
  } catch (err) {
    console.error("[v0] Buckets POST exception:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
