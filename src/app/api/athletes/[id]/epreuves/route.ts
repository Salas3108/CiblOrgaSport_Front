import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const athleteId = Number(params.id)
    if (Number.isNaN(athleteId)) {
      return NextResponse.json({ error: "Athlete ID invalide" }, { status: 400 })
    }

    const dbPath = path.join(process.cwd(), "app", "athlete", "db.json")
    const raw = await fs.readFile(dbPath, "utf-8")
    const db = JSON.parse(raw)

    const links = db.athleteEpreuves || []
    const epreuves = db.epreuves || []

    const epreuveIds = links
      .filter((item: { athleteId: number }) => item.athleteId === athleteId)
      .map((item: { epreuveId: number }) => item.epreuveId)

    const result = epreuves.filter((epreuve: { id: number }) =>
      epreuveIds.includes(epreuve.id)
    )

    return NextResponse.json({ success: true, epreuves: result })
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
