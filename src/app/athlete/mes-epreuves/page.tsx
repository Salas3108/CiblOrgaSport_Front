"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Calendar, Clock, MapPin } from "lucide-react"

interface AthleteEpreuve {
  id: number
  nom: string
  typeEpreuve?: "INDIVIDUELLE" | "COLLECTIVE"
  niveauEpreuve?: "QUALIFICATION" | "QUART_DE_FINALE" | "DEMI_FINALE" | "FINALE"
  genreEpreuve?: "FEMININ" | "MASCULIN" | "MIXTE"
  date?: string
  heureDebut?: string
  heureFin?: string
  lieu?: { id?: number; nom?: string | null } | null
}

function getTypeEpreuveLabel(type: string): string {
  const labels: Record<string, string> = {
    "INDIVIDUELLE": "Individuelle",
    "COLLECTIVE": "Collective"
  }
  return labels[type] || type
}

function getNiveauEpreuveLabel(niveau: string): string {
  const labels: Record<string, string> = {
    "QUALIFICATION": "Qualification",
    "QUART_DE_FINALE": "Quart de finale",
    "DEMI_FINALE": "Demi-finale",
    "FINALE": "Finale"
  }
  return labels[niveau] || niveau
}

function getGenreEpreuveLabel(genre: string | undefined): string {
  if (!genre) return ""
  const labels: Record<string, string> = {
    "FEMININ": "Féminin",
    "MASCULIN": "Masculin",
    "MIXTE": "Mixte"
  }
  return labels[genre] || genre
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

const getAuthHeaders = () => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" }
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken")
  return token
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    : { "Content-Type": "application/json" }
}

const getUserIdFromToken = (): number | null => {
  if (typeof window === "undefined") return null
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken")
  if (!token) return null
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    const data = JSON.parse(json)
    const candidate = data.userId ?? data.id ?? data.sub
    const n = Number(candidate)
    if (!Number.isNaN(n) && Number.isFinite(n)) return Math.trunc(n)
    return null
  } catch {
    return null
  }
}

export default function MesEpreuvesPage() {
  const [athleteId, setAthleteId] = useState<number | null>(null)
  const [epreuves, setEpreuves] = useState<AthleteEpreuve[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolveAthleteId = () => {
    if (typeof window === "undefined") return null
    try {
      const tokenUserId = getUserIdFromToken()
      if (tokenUserId) return tokenUserId

      const raw = localStorage.getItem("user") || sessionStorage.getItem("user")
      if (raw) {
        const parsed = JSON.parse(raw)
        const candidate = parsed.athleteId ?? parsed.id ?? parsed.userId ?? parsed.sub
        if (candidate != null) {
          const n = Number(candidate)
          if (!Number.isNaN(n)) return n
        }
      }
    } catch {
      // ignore
    }
    return null
  }

  const loadEpreuves = async (id: number) => {
    try {
      setLoading(true)
      setError(null)

      const assignmentsResponse = await fetch(`${API_BASE_URL}/api/commissaire/epreuves/assignments`, {
        headers: getAuthHeaders()
      })
      if (!assignmentsResponse.ok) {
        throw new Error(`Erreur lors du chargement des assignations (${assignmentsResponse.status})`)
      }
      const assignmentsData = await assignmentsResponse.json()
      const assignments = assignmentsData?.assignments ?? assignmentsData ?? {}
      const assignedEpreuveIds = Object.entries(assignments)
        .filter(([, athleteIds]) => Array.isArray(athleteIds) && athleteIds.includes(id))
        .map(([epreuveId]) => Number(epreuveId))
        .filter((value) => !Number.isNaN(value))

      if (assignedEpreuveIds.length === 0) {
        setEpreuves([])
        return
      }

      const epreuvesResponse = await fetch(`${API_BASE_URL}/epreuves`, {
        headers: getAuthHeaders()
      })
      if (!epreuvesResponse.ok) {
        throw new Error(`Erreur lors du chargement des epreuves (${epreuvesResponse.status})`)
      }
      const epreuvesData = await epreuvesResponse.json()
      const list = Array.isArray(epreuvesData)
        ? epreuvesData
        : Array.isArray(epreuvesData?.epreuves)
          ? epreuvesData.epreuves
          : []
      const filtered = list.filter((epreuve: AthleteEpreuve) => assignedEpreuveIds.includes(epreuve.id))
      setEpreuves(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      setEpreuves([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const id = resolveAthleteId()
    if (!id) {
      setError("Athlète non identifié")
      setEpreuves([])
      return
    }
    setAthleteId(id)
    loadEpreuves(id)
  }, [])

  const getDateTime = (date: string, time: string) => {
    return new Date(`${date}T${time}`)
  }

  const sortedEpreuves = useMemo(() => {
    return [...epreuves].sort((a, b) => {
      const aDate = a.date || "1970-01-01"
      const bDate = b.date || "1970-01-01"
      const aTime = getDateTime(aDate, a.heureDebut || "00:00").getTime()
      const bTime = getDateTime(bDate, b.heureDebut || "00:00").getTime()
      return aTime - bTime
    })
  }, [epreuves])

  const epreuvesByDate = useMemo(() => {
    return sortedEpreuves.reduce<Record<string, AthleteEpreuve[]>>((acc, epreuve) => {
      const dateKey = epreuve.date || "Sans date"
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(epreuve)
      return acc
    }, {})
  }, [sortedEpreuves])

  const hasOverlap = (current: AthleteEpreuve, list: AthleteEpreuve[]) => {
    if (!current.heureDebut || !current.heureFin || !current.date) return false
    const start = getDateTime(current.date, current.heureDebut).getTime()
    const end = getDateTime(current.date, current.heureFin).getTime()

    return list.some((other) => {
      if (other.id === current.id) return false
      if (!other.date || other.date !== current.date) return false
      if (!other.heureDebut || !other.heureFin) return false

      const otherStart = getDateTime(other.date, other.heureDebut).getTime()
      const otherEnd = getDateTime(other.date, other.heureFin).getTime()
      return start < otherEnd && end > otherStart
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Mes épreuves</span>
            </CardTitle>
            <CardDescription>
              Calendrier et détails des épreuves programmées
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-3 text-sm text-muted-foreground">Chargement des épreuves...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">{error}</p>
                <Button onClick={() => athleteId && loadEpreuves(athleteId)} className="mt-4">
                  Réessayer
                </Button>
              </div>
            ) : sortedEpreuves.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Aucune épreuve programmée pour le moment
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(epreuvesByDate).map(([date, items]) => (
                  <div key={date} className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {date === "Sans date"
                          ? "Sans date"
                          : new Date(date).toLocaleDateString("fr-FR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric"
                            })}
                      </span>
                    </div>
                    <div className="relative border-l pl-6 space-y-4">
                      {items.map((epreuve) => {
                        const overlap = hasOverlap(epreuve, items)
                        return (
                          <div key={epreuve.id} className="relative">
                            <div className="absolute -left-[9px] top-3 h-4 w-4 rounded-full border-2 border-primary bg-background"></div>
                            <div className={`rounded-lg border p-4 ${overlap ? "border-red-300 bg-red-50/50" : "bg-card"}`}>
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-medium">{epreuve.nom}</h3>
                                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                    {epreuve.heureDebut && epreuve.heureFin && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {epreuve.heureDebut} - {epreuve.heureFin}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {epreuve.lieu && typeof epreuve.lieu === "object"
                                        ? epreuve.lieu.nom || "-"
                                        : "-"}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {epreuve.typeEpreuve && (
                                      <Badge variant="outline">{getTypeEpreuveLabel(epreuve.typeEpreuve)}</Badge>
                                    )}
                                    {epreuve.niveauEpreuve && (
                                      <Badge variant="secondary">{getNiveauEpreuveLabel(epreuve.niveauEpreuve)}</Badge>
                                    )}
                                    {epreuve.genreEpreuve && (
                                      <Badge variant="outline">{getGenreEpreuveLabel(epreuve.genreEpreuve)}</Badge>
                                    )}
                                    {overlap && (
                                      <Badge variant="destructive" className="flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Chevauchement
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
