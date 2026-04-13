import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

async function resolveEntryLabels(supabase: any, clientId: string, sprintId: string, taskId: string) {
  const [{ data: client }, { data: sprint }, { data: task }] = await Promise.all([
    supabase.from("clients").select("name").eq("id", clientId).maybeSingle(),
    supabase.from("sprints").select("name").eq("id", sprintId).maybeSingle(),
    supabase.from("tasks").select("title").eq("id", taskId).maybeSingle(),
  ])

  return {
    clientName: client?.name || "Unknown Client",
    sprintName: sprint?.name || null,
    taskTitle: task?.title || "Untitled Task",
  }
}

async function createTimeEntry(
  supabase: any,
  reportId: string,
  payload: { client_id: string; sprint_id: string; task_id: string; hours: number; description: string }
) {
  const labels = await resolveEntryLabels(supabase, payload.client_id, payload.sprint_id, payload.task_id)
  const attempts = [
    {
      daily_report_id: reportId,
      client_id: payload.client_id,
      client_name: labels.clientName,
      sprint_id: payload.sprint_id,
      sprint_name: labels.sprintName,
      task_id: payload.task_id,
      task_title: labels.taskTitle,
      hours: payload.hours,
      work_description: payload.description,
      source: "manual",
      created_at: new Date().toISOString(),
    },
    {
      report_id: reportId,
      client_id: payload.client_id,
      sprint_id: payload.sprint_id,
      task_id: payload.task_id,
      hours: payload.hours,
      work_description: payload.description,
      created_at: new Date().toISOString(),
    },
    {
      report_id: reportId,
      client_id: payload.client_id,
      sprint_id: payload.sprint_id,
      task_id: payload.task_id,
      hours: payload.hours,
      description: payload.description,
      created_at: new Date().toISOString(),
    },
  ]

  let lastError: any = null

  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from("time_entries")
      .insert(attempt)
      .select("*")
      .single()

    if (!error) {
      return {
        data: {
          ...data,
          clients: { name: labels.clientName },
          sprints: { name: labels.sprintName },
          tasks: { title: labels.taskTitle },
          description: (data as any)?.work_description || (data as any)?.description || payload.description,
        },
        error: null,
      }
    }

    lastError = error
  }

  return { data: null, error: lastError }
}

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

export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { reportId } = await params
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

    // Verify report ownership
    const { data: report } = await supabase
      .from("daily_reports")
      .select("id")
      .eq("id", reportId)
      .eq("user_id", authResult.user.id)
      .maybeSingle()

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    // Check report status - can't add entries to submitted reports
    const { data: reportStatus } = await supabase
      .from("daily_reports")
      .select("status")
      .eq("id", reportId)
      .single()

    if (reportStatus?.status === "submitted") {
      return NextResponse.json({ error: "Cannot edit submitted reports" }, { status: 400 })
    }

    // Create time entry
    const { data: entry, error } = await createTimeEntry(supabase, reportId, {
      client_id,
      sprint_id,
      task_id,
      hours,
      description,
    })

    if (error) {
      console.error("[v0] Error creating time entry:", error)
      return NextResponse.json(
        { error: "Failed to create entry", details: error?.message || error?.hint || "Unknown DB error" },
        { status: 500 }
      )
    }

    // Update total hours
    const entries = await loadHoursForReport(supabase, reportId)

    const totalHours = (entries || []).reduce((sum, e) => sum + (e.hours || 0), 0)

    await updateReportTotalHours(supabase, reportId, totalHours)

    return NextResponse.json(entry)
  } catch (error) {
    console.error("[v0] Error in POST time entry:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
