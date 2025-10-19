import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || undefined
    const status = searchParams.get("status") || undefined
    const venue = searchParams.get("venue") || undefined

    const events = await db.getEvents({ type, status, venue })

    return NextResponse.json({ events })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json()

    // Validate required fields
    const requiredFields = ["name", "type", "sport", "venue", "startTime", "endTime"]
    for (const field of requiredFields) {
      if (!eventData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Convert date strings to Date objects
    eventData.startTime = new Date(eventData.startTime)
    eventData.endTime = new Date(eventData.endTime)

    const event = await db.createEvent(eventData)

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
