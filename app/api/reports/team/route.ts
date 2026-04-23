import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    const supabase = getSupabaseAdminClient()

    // Get all reports for the date grouped by user
    const { data: reports, error: reportsError } = await supabase
      .from("daily_reports")
      .select(`
        id,
        user_id,
        users!inner(full_name, email),
        report_date,
        time_entries(
          id,
          hours,
          work_description,
          client_id,
          sprint_id,
          task_id,
          clients(name),
          sprints(name),
          tasks(title)
        )
      `)
      .eq("report_date", date)
      .eq("status", "submitted")
      .order("user_id")

    if (reportsError) {
      console.error("[v0] Reports query error:", reportsError)
      return NextResponse.json({ error: reportsError.message }, { status: 500 })
    }

    // Transform data into grouped structure
    const teamReports = (reports || [])
      .map((report: any) => ({
        userId: report.user_id,
        userName: report.users?.full_name || report.users?.email || "Unknown User",
        totalHours: (report.time_entries || []).reduce((sum: number, e: any) => sum + (e.hours || 0), 0),
        entriesCount: report.time_entries?.length || 0,
        entries: (report.time_entries || []).map((entry: any) => ({
          id: entry.id,
          client: entry.clients?.name || "Unknown Client",
          sprint: entry.sprints?.name || "Unknown Sprint",
          task: entry.tasks?.title || "Untitled Task",
          hours: Number(entry.hours || 0),
          description: entry.work_description || "",
        })),
      }))
      .filter((r: any) => r.entriesCount > 0)
      .sort((a: any, b: any) => b.totalHours - a.totalHours)

    return NextResponse.json({ reports: teamReports, date })
  } catch (error) {
    console.error("[v0] Team reports error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch team reports" },
      { status: 500 }
    )
  }
}
