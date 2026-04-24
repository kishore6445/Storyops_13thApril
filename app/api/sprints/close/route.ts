import { NextRequest, NextResponse } from "next/server"
import { getUserFromToken } from "@/lib/auth"
import { getSupabaseAdminClient } from "@/lib/db"

interface CloseSprintRequest {
  sprintId: string
  destination: "new-sprint" | "existing-sprint" | "backlog"
  existingSprintId: string | null
  newSprintName: string | null
  newSprintStartDate: string | null
  newSprintEndDate: string | null
  newSprintStatus: "planning" | "active" | null
  tasksToMigrate: string[]
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload: CloseSprintRequest = await request.json()
    const { sprintId, destination, existingSprintId, newSprintName, newSprintStartDate, newSprintEndDate, newSprintStatus, tasksToMigrate } = payload

    if (!sprintId) {
      return NextResponse.json({ error: "Sprint ID required" }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()

    // Get the current sprint
    const { data: sprint, error: sprintError } = await supabase
      .from("sprints")
      .select("*")
      .eq("id", sprintId)
      .single()

    if (sprintError || !sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 })
    }

    // Determine pending tasks server-side so closing a sprint works even if the
    // UI sends mismatched status labels or an empty tasksToMigrate array.
    const { data: pendingTasks, error: pendingTasksError } = await supabase
      .from("tasks")
      .select("id")
      .eq("sprint_id", sprintId)
      .in("status", ["todo", "in_progress", "in_review"])

    if (pendingTasksError) {
      console.error("[v0] Error fetching pending sprint tasks:", pendingTasksError)
      return NextResponse.json({ error: "Failed to fetch pending sprint tasks" }, { status: 500 })
    }

    const pendingTaskIds = (pendingTasks || []).map((task) => task.id)

    let destinationSprintId: string | null = null

    // Resolve destination sprint ID
    if (destination === "existing-sprint" && existingSprintId) {
      // Validate the existing sprint belongs to the same client
      const { data: existingSprint, error: existingSprintError } = await supabase
        .from("sprints")
        .select("id, client_id")
        .eq("id", existingSprintId)
        .eq("client_id", sprint.client_id)
        .single()

      if (existingSprintError || !existingSprint) {
        return NextResponse.json({ error: "Target sprint not found or does not belong to this client" }, { status: 400 })
      }

      destinationSprintId = existingSprint.id
    } else if (destination === "new-sprint" && newSprintName) {
      // Create new sprint
      const { data: newSprint, error: createError } = await supabase
        .from("sprints")
        .insert({
          name: newSprintName,
          client_id: sprint.client_id,
          status: newSprintStatus || "planning",
          start_date: newSprintStartDate || new Date().toISOString().split("T")[0],
          end_date: newSprintEndDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        })
        .select("id")
        .single()

      if (createError) {
        return NextResponse.json({ error: "Failed to create new sprint" }, { status: 500 })
      }

      destinationSprintId = newSprint?.id || null
    }

    // Migrate all pending tasks
    if (pendingTaskIds.length > 0) {
      if (destination === "backlog") {
        // Move to backlog (set sprint_id to null)
        await supabase
          .from("tasks")
          .update({ sprint_id: null, status: "todo" })
          .in("id", pendingTaskIds)
      } else {
        // Move to existing or new sprint
        await supabase
          .from("tasks")
          .update({ sprint_id: destinationSprintId })
          .in("id", pendingTaskIds)
      }
    }

    // Mark sprint as completed
    const { error: closeError } = await supabase
      .from("sprints")
      .update({ status: "completed" })
      .eq("id", sprintId)

    if (closeError) {
      console.error("[v0] Error marking sprint as completed:", closeError)
      return NextResponse.json({ error: "Failed to close sprint" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Sprint closed. ${pendingTaskIds.length} tasks migrated.`,
      destinationSprintId,
    })
  } catch (error: any) {
    console.error("[v0] Error closing sprint:", error)
    return NextResponse.json({ error: error.message || "Failed to close sprint" }, { status: 500 })
  }
}
