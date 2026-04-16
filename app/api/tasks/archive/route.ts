import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { taskId, action } = await request.json()

    if (!taskId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get current user from session
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (action === "archive") {
      // Archive the task
      const { data, error } = await supabase
        .from("sprint_tasks")
        .update({
          archived_at: new Date().toISOString(),
          archived_by: user.id,
        })
        .eq("id", taskId)
        .select()

      if (error) {
        console.error("[v0] Archive error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data, message: "Task archived successfully" })
    } else if (action === "restore") {
      // Restore archived task
      const { data, error } = await supabase
        .from("sprint_tasks")
        .update({
          archived_at: null,
          archived_by: null,
        })
        .eq("id", taskId)
        .select()

      if (error) {
        console.error("[v0] Restore error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data, message: "Task restored successfully" })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Archive endpoint error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
