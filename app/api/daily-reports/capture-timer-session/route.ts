import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

async function createTimerEntry(
  supabase: any,
  reportId: string,
  payload: {
    taskId: string
    taskTitle: string
    clientName?: string
    sprintName?: string
    hours: number
    description?: string
    timerSessionId: string
  }
) {
  const workDescription = payload.description || `Auto-captured from Pomodoro timer (${payload.hours}h)`
  const attempts = [
    {
      daily_report_id: reportId,
      task_id: payload.taskId,
      task_title: payload.taskTitle,
      client_id: null,
      client_name: payload.clientName || "Unspecified",
      sprint_id: null,
      sprint_name: payload.sprintName || null,
      hours: payload.hours,
      work_description: workDescription,
      source: "timer_captured",
      related_session_id: payload.timerSessionId,
      created_at: new Date().toISOString(),
    },
    {
      report_id: reportId,
      task_id: payload.taskId,
      client_id: null,
      sprint_id: null,
      hours: payload.hours,
      work_description: workDescription,
      created_at: new Date().toISOString(),
    },
    {
      report_id: reportId,
      task_id: payload.taskId,
      client_id: null,
      sprint_id: null,
      hours: payload.hours,
      description: workDescription,
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
      return { data, error: null }
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

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, taskTitle, clientName, sprintName, startTime, endTime, durationSeconds, description } = body

    // Validation
    if (!taskId || !taskTitle || !startTime || !durationSeconds) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (durationSeconds <= 0) {
      return NextResponse.json({ error: "Timer duration must be greater than 0" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const sessionDate = new Date(startTime).toISOString().split("T")[0]
    const hours = Math.round((durationSeconds / 3600) * 100) / 100

    // Step 1: Save timer session
    const { data: timerSession, error: timerError } = await supabase
      .from("timer_sessions")
      .insert({
        user_id: authResult.user.id,
        task_id: taskId,
        task_title: taskTitle,
        client_name: clientName || null,
        sprint_name: sprintName || null,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : new Date().toISOString(),
        duration_seconds: durationSeconds,
        status: "completed",
        session_date: sessionDate,
        notes: description || null,
      } as any)
      .select()
      .single()

    if (timerError) {
      console.error("[v0] Error saving timer session:", timerError)
      return NextResponse.json({ error: "Failed to save timer session" }, { status: 500 })
    }

    // Step 2: Get or create daily report for today
    const { data: dailyReport, error: reportError } = await supabase
      .from("daily_reports")
      .upsert(
        {
          user_id: authResult.user.id,
          report_date: sessionDate,
          status: "draft",
        } as any,
        {
          onConflict: "user_id,report_date",
        }
      )
      .select()
      .single()

    if (reportError) {
      console.error("[v0] Error managing daily report:", reportError)
      return NextResponse.json({ error: "Failed to manage daily report" }, { status: 500 })
    }

    // Step 3: Create time entry linked to timer session
    const { data: timeEntry, error: entryError } = await createTimerEntry(supabase, (dailyReport as any).id, {
      taskId,
      taskTitle,
      clientName,
      sprintName,
      hours,
      description,
      timerSessionId: (timerSession as any).id,
    })

    if (entryError) {
      console.error("[v0] Error creating time entry:", entryError)
      return NextResponse.json(
        { error: "Failed to create time entry", details: entryError?.message || entryError?.hint || "Unknown DB error" },
        { status: 500 }
      )
    }

    // Step 4: Sync total hours on daily report
    const entries = await loadHoursForReport(supabase, (dailyReport as any).id)
    const totalHours = (entries || []).reduce((sum: number, entry: any) => sum + (entry.hours || 0), 0)
    await (supabase.from("daily_reports") as any)
      .update({ total_hours: totalHours })
      .eq("id", (dailyReport as any).id)

    return NextResponse.json({
      success: true,
      timerSession,
      timeEntry,
      message: `${hours}h session captured to daily report`,
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/daily-reports/capture-timer-session:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
