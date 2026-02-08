"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Users, AlertCircle } from "lucide-react"

interface Coequipier {
  id: number
  nom: string
  prenom: string
  pays: string
  role?: string
}

interface Equipe {
  id: number
  nom: string
  members: Coequipier[]
  categorie?: string
}

interface AthleteEpreuve {
  id: number
  nom: string
  typeEpreuve: "INDIVIDUELLE" | "COLLECTIVE"
  niveauEpreuve: "QUALIFICATION" | "QUART_DE_FINALE" | "DEMI_FINALE" | "FINALE"
  genreEpreuve?: "FEMININ" | "MASCULIN" | "MIXTE"
  date: string
  heureDebut: string
  heureFin: string
  lieu: { id?: number; nom?: string } | string
}

const API_BASE_URL = "http://localhost:3001"

// Use mock data by default; set NEXT_PUBLIC_USE_MOCK=false once backend is ready
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false"

function getUserIdFromStorage(): number {
  if (typeof window === "undefined") return 1
  try {
    const raw = localStorage.getItem("user")
    if (!raw) return 1
    const parsed = JSON.parse(raw)
    const candidate = parsed.id ?? parsed.userId ?? parsed.sub ?? parsed.spectatorId
    const parseId = (c: any): number | null => {
      if (c === undefined || c === null) return null
      const n = Number(c)
      if (!Number.isNaN(n) && Number.isFinite(n)) return Math.trunc(n)
      const s = String(c)
      const m = s.match(/(\d+)/)
      if (m) return Number(m[1])
      return null
    }
    const id = parseId(candidate)
    return id ?? 1
  } catch (e) {
    return 1
  }
}

// Mock epreuves (using backend enums: TypeEpreuve, NiveauEpreuve, GenreEpreuve)
const MOCK_EPREUVES = [
  { date: "2026-02-10", nom: "100m Sprint", heureDebut: "10:00", heureFin: "10:30", lieu: "Stade Olympique", typeEpreuve: "INDIVIDUELLE" as const, niveauEpreuve: "DEMI_FINALE" as const, genreEpreuve: "MASCULIN" as const },
  { date: "2026-02-10", nom: "Saut en longueur", heureDebut: "10:15", heureFin: "11:00", lieu: "Stade Olympique", typeEpreuve: "INDIVIDUELLE" as const, niveauEpreuve: "DEMI_FINALE" as const, genreEpreuve: "FEMININ" as const },
  { date: "2026-02-11", nom: "Relais 4x100", heureDebut: "16:00", heureFin: "16:45", lieu: "Piste A", typeEpreuve: "COLLECTIVE" as const, niveauEpreuve: "FINALE" as const, genreEpreuve: "MIXTE" as const },
]

function deriveEquipeRoleFromEpreuves(epreuves: any[]) {
  if (epreuves.some(e => e.typeEpreuve === "COLLECTIVE" || /relais/i.test(e.nom))) return "Relayeur"
  if (epreuves.some(e => /100m|sprint/i.test(e.nom))) return "Sprinteur"
  if (epreuves.some(e => /saut|longueur/i.test(e.nom))) return "Sauteur"
  return "Athlète"
}

const derivedRole = deriveEquipeRoleFromEpreuves(MOCK_EPREUVES)

// Mock équipe used until backend is ready — members share the same derived role
const MOCK_EQUIPE: Equipe = {
  id: 999,
  nom: "Team Demo",
  categorie: "Senior Mixte",
  members: [
    { id: 1, prenom: "Alice", nom: "Dupont", pays: "France", role: derivedRole },
    { id: 2, prenom: "Marc", nom: "Leroy", pays: "France", role: derivedRole },
    { id: 3, prenom: "Sofia", nom: "Ivanova", pays: "Russie", role: derivedRole }
  ]
}

export default function MonEquipePage() {
  const [equipe, setEquipe] = useState<Equipe | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const id = getUserIdFromStorage()
    loadEquipe(id)
  }, [])

  const loadEquipe = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      if (USE_MOCK) {
        setEquipe(MOCK_EQUIPE)
        return
      }
      const res = await fetch(`${API_BASE_URL}/api/athletes/${id}/equipe`)
      if (!res.ok) {
        // Backend not ready / endpoint missing — use mock data for now
        console.warn("Equipe endpoint not available, using mock data")
        setEquipe(MOCK_EQUIPE)
        return
      }
      const data = await res.json()
      // If backend returns empty / individual athlete, fallback to mock (or null)
      if (!data) {
        setEquipe(MOCK_EQUIPE)
      } else {
        setEquipe(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      // Use mock data when fetch fails
      setEquipe(MOCK_EQUIPE)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header />
      <main className="max-w-5xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Mon équipe</CardTitle>
            <CardDescription>Informations sur votre équipe et vos coéquipiers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Chargement...</div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">{error}</p>
                <Button onClick={() => loadEquipe(1)} className="mt-4">Réessayer</Button>
              </div>
            ) : !equipe ? (
              <div className="text-center py-8">
                <Badge variant="secondary" className="mb-4">Épreuve individuelle</Badge>
                <Users className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">Vous participez à une épreuve individuelle</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-background border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{equipe.nom}</h3>
                  {equipe.categorie && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{equipe.categorie}</Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Coéquipiers ({equipe.members?.length || 0})</h4>
                  {equipe.members && equipe.members.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                      {equipe.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{member.prenom} {member.nom}</p>
                              <p className="text-sm text-muted-foreground">{member.pays}</p>
                            </div>
                          </div>
                          <Badge variant={member.role ? "secondary" : "outline"} className="ml-2">
                            {member.role ?? "Non spécifié"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">Aucun coéquipier pour le moment</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
