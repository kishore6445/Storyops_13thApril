import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Allow access via share token (for public shared report pages)
    const shareToken = request.headers.get("x-share-token")
    if (!shareToken) {
      const authResult = await verifyAuth(request)
      if (!authResult.authenticated || !authResult.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    } else {
      // Validate share token exists in DB
      const supabaseCheck = getSupabaseAdminClient()
      const { data: share } = await supabaseCheck
        .from("report_shares")
        .select("id")
        .eq("share_token", shareToken)
        .single()
      if (!share) {
        return NextResponse.json({ error: "Invalid share token" }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const clientId = searchParams.get("clientId") || null
    const userId = searchParams.get("userId") || null // specific user or null = all

    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: "dateFrom and dateTo are required" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // 1. Fetch daily_reports in range
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
      return NextResponse.json({ error: reportsError.message }, { status: 500 })
    }

    if (!reports || reports.length === 0) {
      return NextResponse.json({ entries: [], reports: [], summary: { totalHours: 0, totalEntries: 0 } })
    }

    const reportIds = reports.map((r: any) => r.id)

    // 2. Fetch time_entries for those reports
    // Note: the column is "daily_report_id" (from create-pomodoro-tables.sql which superseded create-daily-reports-tables.sql)
    let entriesQuery = supabase
      .from("time_entries")
      .select("id, daily_report_id, client_id, sprint_id, task_id, hours, work_description, description, created_at")
      .in("daily_report_id", reportIds)
      .order("created_at", { ascending: false })

    if (clientId) {
      entriesQuery = entriesQuery.eq("client_id", clientId)
    }

    const { data: rawEntries, error: entriesError } = await entriesQuery
    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 })
    }

    const entries = rawEntries || []

    // 3. Enrich with client/sprint/task/user names
    const clientIds = [...new Set(entries.map((e: any) => e.client_id).filter(Boolean))]
    const sprintIds = [...new Set(entries.map((e: any) => e.sprint_id).filter(Boolean))]
    const taskIds = [...new Set(entries.map((e: any) => e.task_id).filter(Boolean))]
    const userIds = [...new Set(reports.map((r: any) => r.user_id).filter(Boolean))]

    const [{ data: clients }, { data: sprints }, { data: tasks }, { data: users }] = await Promise.all([
      clientIds.length ? supabase.from("clients").select("id, name").in("id", clientIds) : Promise.resolve({ data: [] }),
      sprintIds.length ? supabase.from("sprints").select("id, name").in("id", sprintIds) : Promise.resolve({ data: [] }),
      taskIds.length ? supabase.from("tasks").select("id, title").in("id", taskIds) : Promise.resolve({ data: [] }),
      userIds.length ? supabase.from("users").select("id, full_name, email").in("id", userIds) : Promise.resolve({ data: [] }),
    ])

    const clientMap = new Map((clients || []).map((c: any) => [c.id, c.name]))
    const sprintMap = new Map((sprints || []).map((s: any) => [s.id, s.name]))
    const taskMap = new Map((tasks || []).map((t: any) => [t.id, t.title]))
    const userMap = new Map((users || []).map((u: any) => [u.id, { name: u.full_name || u.email, email: u.email }]))
    const reportMap = new Map(reports.map((r: any) => [r.id, r]))

    const enrichedEntries = entries.map((entry: any) => {
      const report = reportMap.get(entry.daily_report_id)
      const userInfo = report ? userMap.get(report.user_id) : null
      return {
        id: entry.id,
        report_id: entry.report_id,
        report_date: report?.report_date,
        user_id: report?.user_id,
        user_name: userInfo?.name || "Unknown",
        user_email: userInfo?.email || "",
        client_id: entry.client_id,
        client_name: clientMap.get(entry.client_id) || "Unknown Client",
        sprint_id: entry.sprint_id,
        sprint_name: sprintMap.get(entry.sprint_id) || "Unknown Sprint",
        task_id: entry.task_id,
        task_title: taskMap.get(entry.task_id) || "Untitled Task",
        hours: Number(entry.hours || 0),
        description: entry.work_description || entry.description || "",
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
