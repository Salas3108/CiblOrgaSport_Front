import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const results = await db.getResultsByEvent(eventId)

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const resultData = await request.json()

    // Validate required fields
    const requiredFields = ["eventId", "participantId", "position"]
    for (const field of requiredFields) {
      if (resultData[field] === undefined) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    const result = await db.createResult(resultData)

    return NextResponse.json({ result }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create result" }, { status: 500 })
  }
}
