import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getSupabaseAdminClient } from "@/lib/db"

// PATCH /api/content/buckets/:id — update counts inline
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { productionDone, scheduled, published, ownerId } = body

    const supabase = getSupabaseAdminClient()

    // Fetch current row to validate constraints
    const { data: current, error: fetchError } = await supabase
      .from("content_buckets")
      .select("target, production_done, scheduled, published")
      .eq("id", id)
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: "Bucket not found" }, { status: 404 })
    }

    const newProd = productionDone !== undefined ? productionDone : current.production_done
    const newSched = scheduled !== undefined ? scheduled : current.scheduled
    const newPub = published !== undefined ? published : current.published

    // Enforce cascade validation
    if (newProd > current.target) {
      return NextResponse.json({ error: `Production done (${newProd}) cannot exceed target (${current.target})` }, { status: 400 })
    }
    if (newSched > newProd) {
      return NextResponse.json({ error: `Scheduled (${newSched}) cannot exceed production done (${newProd})` }, { status: 400 })
    }
    if (newPub > newSched) {
      return NextResponse.json({ error: `Published (${newPub}) cannot exceed scheduled (${newSched})` }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {
      production_done: newProd,
      scheduled: newSched,
      published: newPub,
    }
    if (ownerId !== undefined) updatePayload.owner_id = ownerId

    const { data, error } = await supabase
      .from("content_buckets")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single()

    if (error) {
      console.error("[v0] Bucket PATCH error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bucket: data })
  } catch (err) {
    console.error("[v0] Bucket PATCH exception:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/content/buckets/:id
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const supabase = getSupabaseAdminClient()

    const { error } = await supabase.from("content_buckets").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
