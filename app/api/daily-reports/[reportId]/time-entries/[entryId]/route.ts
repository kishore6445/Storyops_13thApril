import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

async function loadHoursForReport(supabase: any, reportId: string) {
  for (const foreignKey of ["daily_report_id", "report_id"]) {
    const { data, error } = await supabase
      .from("time_entries")
      .select("hours")
      .eq(foreignKey, reportId)

    if (!error) {
      return data || []
    }
  }

  return []
}

async function updateReportTotalHours(supabase: any, reportId: string, totalHours: number) {
  await supabase
    .from("daily_reports")
    .update({ total_hours: totalHours })
    .eq("id", reportId)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ reportId: string; entryId: string }> }) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reportId, entryId } = await params
    const body = await request.json()
    const { client_id, sprint_id, task_id, hours, description } = body

    // Validation
    if (!client_id || !sprint_id || !task_id || !hours || !description) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (hours < 0.25 || hours > 10) {
      return NextResponse.json({ error: "Hours must be between 0.25 and 10" }, { status: 400 })
    }

    if (description.trim().length < 10) {
      return NextResponse.json({ error: "Description must be at least 10 characters" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // Verify report ownership and status
    const { data: report } = await supabase
      .from("daily_reports")
      .select("status")
      .eq("id", reportId)
      .eq("user_id", authResult.user.id)
      .maybeSingle()

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    if (report.status === "submitted") {
      return NextResponse.json({ error: "Cannot edit submitted reports" }, { status: 400 })
    }

    // Update time entry
    const updateAttempts = [
      { field: "work_description", foreignKey: "daily_report_id" },
      { field: "work_description", foreignKey: "report_id" },
      { field: "description", foreignKey: "report_id" },
    ]

    let entry: any = null
    let error: any = null

    for (const attempt of updateAttempts) {
      const result = await supabase
        .from("time_entries")
        .update({
          client_id,
          sprint_id,
          task_id,
          hours,
          [attempt.field]: description,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entryId)
        .eq(attempt.foreignKey, reportId)
        .select(
          `
          *,
          clients(name),
          sprints(name),
          tasks(title)
        `
        )
        .single()

      if (!result.error) {
        entry = result.data
        error = null
        break
      }

      error = result.error
    }

    if (error) {
      console.error("[v0] Error updating time entry:", error)
      return NextResponse.json({ error: "Failed to update entry" }, { status: 500 })
    }

    // Update total hours
    const entries = await loadHoursForReport(supabase, reportId)
    const totalHours = (entries || []).reduce((sum, e) => sum + (e.hours || 0), 0)
    await updateReportTotalHours(supabase, reportId, totalHours)

    return NextResponse.json(entry)
  } catch (error) {
    console.error("[v0] Error in PUT time entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ reportId: string; entryId: string }> }) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reportId, entryId } = await params

    const supabase = getSupabaseAdminClient()

    // Verify report ownership and status
    const { data: report } = await supabase
      .from("daily_reports")
      .select("status")
      .eq("id", reportId)
      .eq("user_id", authResult.user.id)
      .maybeSingle()

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    if (report.status === "submitted") {
      return NextResponse.json({ error: "Cannot edit submitted reports" }, { status: 400 })
    }

    // Delete time entry
    let error: any = null
    for (const foreignKey of ["daily_report_id", "report_id"]) {
      const result = await supabase
        .from("time_entries")
        .delete()
        .eq("id", entryId)
        .eq(foreignKey, reportId)

      if (!result.error) {
        error = null
        break
      }

      error = result.error
    }

    if (error) {
      console.error("[v0] Error deleting time entry:", error)
      return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 })
    }

    // Update total hours
    const entries = await loadHoursForReport(supabase, reportId)

    const totalHours = (entries || []).reduce((sum, e) => sum + (e.hours || 0), 0)

    await updateReportTotalHours(supabase, reportId, totalHours)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE time entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
