import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/db"
import { validateSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { taskId, action } = await request.json()

    if (!taskId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || ""
    const session = await validateSession(token)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseAdminClient()

    if (action === "archive") {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          archived_at: new Date().toISOString(),
          archived_by: session.userId,
        })
        .eq("id", taskId)
        .select()

      if (error) {
        console.error("[v0] Archive error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data, message: "Task archived successfully" })
    } else if (action === "restore") {
      const { data, error } = await supabase
        .from("tasks")
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
