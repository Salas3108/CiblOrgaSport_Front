import { NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const venues = await db.getVenues()

    return NextResponse.json({ venues })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch venues" }, { status: 500 })
  }
}
