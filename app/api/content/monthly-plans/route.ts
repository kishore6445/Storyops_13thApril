import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getSupabaseAdminClient } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, month, year, items, notes } = body

    if (!clientId || !month || !year || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: clientId, month, year, items" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()

    // Store the monthly plan metadata
    const { data: planData, error: planError } = await supabase
      .from("content_records")
      .insert(
        items.map((item: any, index: number) => {
          const dayInMonth = Math.floor((index * 28) / items.length) + 1
          const plannedDate = new Date(parseInt(year), parseInt(month) - 1, Math.min(dayInMonth, 28))

          return {
            client_id: clientId,
            created_by: user.id,
            owner_id: null,
            title: `${item.contentType || "Content"} - ${item.platform}`,
            content_type: item.contentType,
            platform: item.platform,
            planning_month: month,
            planning_year: year,
            planned_date: plannedDate.toISOString().split("T")[0],
            status: "planned",
            notes: notes || null,
            monthly_plan_flag: true,
          }
        })
      )
      .select("*")

    if (planError) {
      console.error("[v0] Failed to create monthly plan:", planError)
      return NextResponse.json({ error: planError.message }, { status: 500 })
    }

    console.log("[v0] Created monthly plan with", items.length, "items")

    return NextResponse.json(
      {
        success: true,
        message: `Created monthly plan with ${items.length} content items`,
        itemsCreated: planData?.length || 0,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[v0] Failed to create monthly plan:", error)
    return NextResponse.json(
      { error: "Failed to create monthly plan" },
      { status: 500 }
    )
  }
}
