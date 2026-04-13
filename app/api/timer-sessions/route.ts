import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function POST(request: NextRequest) {
  try {
    debugger
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    debugger
    const { taskId, taskTitle, clientName, sprintName, startTime, endTime, durationSeconds, notes } = body

    if (!taskTitle || !startTime || !endTime || durationSeconds === undefined || durationSeconds === null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const safeDurationSeconds = Number(durationSeconds)
    if (!Number.isFinite(safeDurationSeconds) || safeDurationSeconds <= 0) {
      return NextResponse.json({ error: "Timer duration must be greater than 0" }, { status: 400 })
    }

    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid start or end time" }, { status: 400 })
    }

    if (!isUuid(authResult.user.id)) {
      return NextResponse.json(
        { error: "Invalid authenticated user id format", details: "Expected UUID for user_id column" },
        { status: 400 }
      )
    }

    const sessionDate = startDate.toISOString().split("T")[0]
    const supabase = getSupabaseAdminClient()

    debugger
    const { data: session, error } = await supabase
      .from("timer_sessions")
      .insert({
        user_id: authResult.user.id,
        task_id: taskId && isUuid(String(taskId)) ? taskId : null,
        task_title: taskTitle,
        client_name: clientName || null,
        sprint_name: sprintName || null,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        duration_seconds: Math.floor(safeDurationSeconds),
        status: "completed",
        session_date: sessionDate,
        notes: notes || null,
      } as any)
      .select("*")
      .single()

    debugger

    if (error) {
      console.error("[v0] Error creating timer session:", error)
      debugger
      return NextResponse.json(
        { error: "Failed to save timer session", details: error?.message || error?.hint || "Unknown DB error" },
        { status: 500 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error("[v0] Error in POST /api/timer-sessions:", error)
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
    const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0]

    const supabase = getSupabaseAdminClient()

    const { data: sessions, error } = await supabase
      .from("timer_sessions")
      .select("*")
      .eq("user_id", authResult.user.id)
      .eq("session_date", date)
      .order("start_time", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching timer sessions:", error)
      return NextResponse.json({ error: "Failed to fetch timer sessions" }, { status: 500 })
    }

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    console.error("[v0] Error in GET /api/timer-sessions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
