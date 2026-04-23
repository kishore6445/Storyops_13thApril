import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Allow access via share token (for public shared report pages)
    const shareToken = request.headers.get("x-share-token")
    if (shareToken) {
      const supabaseCheck = getSupabaseAdminClient()
      const { data: share } = await supabaseCheck
        .from("report_shares")
        .select("id")
        .eq("share_token", shareToken)
        .single()
      if (!share) {
        return NextResponse.json({ error: "Invalid share token" }, { status: 401 })
      }
    } else {
      const authResult = await verifyAuth(request)
      if (!authResult.authenticated || !authResult.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const clientId = searchParams.get("clientId") || null
    const userId = searchParams.get("userId") || null

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: "dateFrom and dateTo are required" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // 1. Fetch daily_reports in date range
    let reportsQuery = supabase
      .from("daily_reports")
      .select("id, user_id, report_date, status, total_hours")
      .gte("report_date", dateFrom)
      .lte("report_date", dateTo)
      .order("report_date", { ascending: false })

    if (userId) {
      reportsQuery = reportsQuery.eq("user_id", userId)
    }

    const { data: reports, error: reportsError } = await reportsQuery
    if (reportsError) {
      console.error("[v0] Reports query error:", reportsError)
      return NextResponse.json({ error: reportsError.message }, { status: 500 })
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json({ entries: [], reports: [], summary: { totalHours: 0, totalEntries: 0 } })
    }

    const reportIds = reports.map((r: any) => r.id)

    // 2. Fetch time_entries — names (client_name, task_title, sprint_name) are stored
    //    directly as text columns on time_entries. Use them as-is.
    let entriesQuery = supabase
      .from("time_entries")
      .select("id, daily_report_id, client_id, client_name, sprint_id, sprint_name, task_id, task_title, hours, work_description, created_at")
      .in("daily_report_id", reportIds)
      .order("created_at", { ascending: false })

    if (clientId) {
      entriesQuery = entriesQuery.eq("client_id", clientId)
    }

    const { data: rawEntries, error: entriesError } = await entriesQuery
    if (entriesError) {
      console.error("[v0] Entries query error:", entriesError)
      return NextResponse.json({ error: entriesError.message }, { status: 500 })
    }

    const entries = rawEntries || []

    // 3. Fetch user names for the report owners
    const userIds = [...new Set(reports.map((r: any) => r.user_id).filter(Boolean))]
    const { data: users } = userIds.length
      ? await supabase.from("users").select("id, full_name, email").in("id", userIds)
      : { data: [] }

    const userMap = new Map((users || []).map((u: any) => [u.id, { name: u.full_name || u.email, email: u.email || "" }]))
    const reportMap = new Map(reports.map((r: any) => [r.id, r]))

    // 4. Build enriched entries using the stored text names directly
    const enrichedEntries = entries.map((entry: any) => {
      const report = reportMap.get(entry.daily_report_id)
      const userInfo = report ? userMap.get(report.user_id) : null
      return {
        id: entry.id,
        report_date: report?.report_date || "",
        user_id: report?.user_id || "",
        user_name: userInfo?.name || "Unknown",
        user_email: userInfo?.email || "",
        client_id: entry.client_id || "",
        client_name: entry.client_name || "Unknown Client",
        sprint_id: entry.sprint_id || "",
        sprint_name: entry.sprint_name || "",
        task_id: entry.task_id || "",
        task_title: entry.task_title || "Untitled Task",
        hours: Number(entry.hours || 0),
        description: entry.work_description || "",
      }
    })

    const totalHours = enrichedEntries.reduce((sum: number, e: any) => sum + e.hours, 0)

    return NextResponse.json({
      entries: enrichedEntries,
      reports: reports.map((r: any) => ({
        ...r,
        user_name: userMap.get(r.user_id)?.name || "Unknown",
      })),
      summary: {
        totalHours: Math.round(totalHours * 100) / 100,
        totalEntries: enrichedEntries.length,
      },
    })
  } catch (error) {
    console.error("[v0] Reports summary error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
