import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

async function createDraftReport(supabase: any, userId: string, date: string) {
  const basePayload = {
    user_id: userId,
    report_date: date,
    status: "draft",
    created_at: new Date().toISOString(),
  }

  const attempts = [
    { ...basePayload, total_hours: 0 },
    basePayload,
  ]

  let lastError: any = null

  for (const payload of attempts) {
    const { data, error } = await supabase
      .from("daily_reports")
      .insert(payload)
      .select()
      .single()

    if (!error) {
      return { data, error: null }
    }

    lastError = error
  }

  return { data: null, error: lastError }
}

async function fetchReportEntries(supabase: any, reportId: string) {
  const selectClauses = [
    `
        *,
        clients(name),
        sprints(name),
        tasks(title)
      `,
    "*",
  ]

  const foreignKeys = ["daily_report_id", "report_id"]
  let lastError: any = null

  for (const selectClause of selectClauses) {
    for (const foreignKey of foreignKeys) {
      const { data, error } = await supabase
        .from("time_entries")
        .select(selectClause)
        .eq(foreignKey, reportId)
        .order("created_at", { ascending: false })

      if (!error) {
        return { data: data || [], error: null }
      }

      lastError = error
    }
  }

  return { data: [], error: lastError }
}

async function enrichReportEntries(supabase: any, entries: any[]) {
  if (!entries.length) {
    return entries
  }

  const clientIds = [...new Set(entries.map((entry) => entry.client_id).filter(Boolean))]
  const sprintIds = [...new Set(entries.map((entry) => entry.sprint_id).filter(Boolean))]
  const taskIds = [...new Set(entries.map((entry) => entry.task_id).filter(Boolean))]

  const [{ data: clients }, { data: sprints }, { data: tasks }] = await Promise.all([
    clientIds.length ? supabase.from("clients").select("id, name").in("id", clientIds) : Promise.resolve({ data: [] }),
    sprintIds.length ? supabase.from("sprints").select("id, name").in("id", sprintIds) : Promise.resolve({ data: [] }),
    taskIds.length ? supabase.from("tasks").select("id, title").in("id", taskIds) : Promise.resolve({ data: [] }),
  ])

  const clientMap = new Map((clients || []).map((client: any) => [client.id, client.name]))
  const sprintMap = new Map((sprints || []).map((sprint: any) => [sprint.id, sprint.name]))
  const taskMap = new Map((tasks || []).map((task: any) => [task.id, task.title]))

  return entries.map((entry) => ({
    ...entry,
    clients: entry.clients || (entry.client_id ? { name: clientMap.get(entry.client_id) || entry.client_name || "Unknown Client" } : undefined),
    sprints: entry.sprints || (entry.sprint_id ? { name: sprintMap.get(entry.sprint_id) || entry.sprint_name || "Unknown Sprint" } : undefined),
    tasks: entry.tasks || (entry.task_id ? { title: taskMap.get(entry.task_id) || entry.task_title || "Untitled Task" } : undefined),
    client_name: entry.client_name || (entry.client_id ? clientMap.get(entry.client_id) : entry.client_name),
    sprint_name: entry.sprint_name || (entry.sprint_id ? sprintMap.get(entry.sprint_id) : entry.sprint_name),
    task_title: entry.task_title || (entry.task_id ? taskMap.get(entry.task_id) : entry.task_title),
  }))
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { date } = body

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // Check if report already exists for this date
    const { data: existingReport } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("user_id", authResult.user.id)
      .eq("report_date", date)
      .maybeSingle()

    if (existingReport) {
      return NextResponse.json(existingReport)
    }

    // Create new report
    const { data: newReport, error } = await createDraftReport(supabase, authResult.user.id, date)

    if (error) {
      console.error("[v0] Error creating daily report:", error)
      return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
    }

    return NextResponse.json(newReport)
  } catch (error) {
    console.error("[v0] Error in POST /api/daily-reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const date = url.searchParams.get("date")

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    const { data: report, error } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("user_id", authResult.user.id)
      .eq("report_date", date)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching report:", error)
      return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
    }

    if (!report) {
      // Create a new draft report
      const { data: newReport, error: createError } = await createDraftReport(supabase, authResult.user.id, date)

      if (createError) {
        console.error("[v0] Error creating report:", createError)
        return NextResponse.json({ error: "Failed to create report" }, { status: 500 })
      }

      return NextResponse.json({ report: newReport, entries: [] })
    }

    // Fetch all time entries for this report
    const { data: entries, error: entriesError } = await fetchReportEntries(supabase, (report as any).id)

    if (entriesError) {
      console.error("[v0] Error fetching entries:", entriesError)
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
    }

    const enrichedEntries = await enrichReportEntries(supabase, entries || [])

    return NextResponse.json({ report, entries: enrichedEntries })
  } catch (error) {
    console.error("[v0] Error in GET /api/daily-reports:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
