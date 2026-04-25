import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  // Verify the request is from Vercel's cron job service
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    console.log("[v0] Running weekly sprint auto-creation cron job...")

    // Call the auto-create endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/sprints/auto-create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      throw new Error(`Auto-create API returned ${response.status}`)
    }

    const result = await response.json()
    console.log("[v0] Cron job completed:", result.summary)

    return NextResponse.json(
      { success: true, message: result.summary },
      { status: 200 }
    )
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] Cron job failed:", errorMsg)
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    )
  }
}
