import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || undefined
    const severity = searchParams.get("severity") || undefined

    const incidents = await db.getIncidents({ status, severity })

    return NextResponse.json({ incidents })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const incidentData = await request.json()

    // Validate required fields
    const requiredFields = ["title", "description", "type", "severity", "reportedBy"]
    for (const field of requiredFields) {
      if (!incidentData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    const incident = await db.createIncident({
      ...incidentData,
      status: "open",
      affectedRoles: incidentData.affectedRoles || [],
    })

    return NextResponse.json({ incident }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create incident" }, { status: 500 })
  }
}
