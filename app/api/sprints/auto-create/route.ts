import { NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"
import { generateSprintName, getNextSequenceNumber, getNextWeekMonday, getNextWeekSaturday } from "@/lib/sprint-naming"

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    // Get all active clients
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, name")
      .eq("is_active", true)

    if (clientsError || !clients) {
      console.error("[v0] Error fetching clients:", clientsError)
      return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 })
    }

    const createdSprints = []
    const errors = []

    for (const client of clients) {
      try {
        // Get existing sprints for this client
        const { data: existingSprints, error: sprintsError } = await supabase
          .from("sprints")
          .select("name")
          .eq("client_id", client.id)
          .order("created_at", { ascending: false })

        if (sprintsError) {
          console.error(`[v0] Error fetching sprints for client ${client.id}:`, sprintsError)
          errors.push({ clientId: client.id, error: sprintsError.message })
          continue
        }

        // Calculate next sequence number
        const nextSeq = getNextSequenceNumber(existingSprints || [])

        // Generate sprint name: Sprint N_XXX_MonDD-MonDD
        const sprintName = generateSprintName(client.name, nextSeq)
        const startDate = getNextWeekMonday()
        const endDate = getNextWeekSaturday()

        // Create sprint
        const { data: newSprint, error: createError } = await supabase
          .from("sprints")
          .insert({
            client_id: client.id,
            name: sprintName,
            start_date: startDate.toISOString().split("T")[0],
            end_date: endDate.toISOString().split("T")[0],
            status: "active",
            auto_created: true, // Track that this was auto-created
          })
          .select()

        if (createError) {
          console.error(`[v0] Error creating sprint for client ${client.id}:`, createError)
          errors.push({ clientId: client.id, error: createError.message })
          continue
        }

        createdSprints.push({
          clientId: client.id,
          clientName: client.name,
          sprintName,
          sprintId: newSprint?.[0]?.id,
        })

        console.log(`[v0] Auto-created sprint: ${sprintName} for client ${client.name}`)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error"
        console.error(`[v0] Exception creating sprint for client ${client.id}:`, errorMsg)
        errors.push({ clientId: client.id, error: errorMsg })
      }
    }

    return NextResponse.json(
      {
        success: true,
        created: createdSprints,
        errors: errors.length > 0 ? errors : undefined,
        summary: `Created ${createdSprints.length} sprints, ${errors.length} errors`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Sprint auto-create failed:", error)
    return NextResponse.json(
      { error: "Sprint auto-creation failed" },
      { status: 500 }
    )
  }
}
