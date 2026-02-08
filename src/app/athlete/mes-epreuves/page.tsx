"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Calendar, Clock, MapPin } from "lucide-react"
import db from "../db.json"

interface AthleteEpreuve {
  id: number
  nom: string
  typeEpreuve: "INDIVIDUELLE" | "COLLECTIVE"
  niveauEpreuve: "QUALIFICATION" | "QUART_DE_FINALE" | "DEMI_FINALE" | "FINALE"
  genreEpreuve?: "FEMININ" | "MASCULIN" | "MIXTE"
  date: string
  heureDebut: string
  heureFin: string
  lieu: string
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


export default function MesEpreuvesPage() {
  const [athleteId, setAthleteId] = useState<number | null>(null)
  const [epreuves, setEpreuves] = useState<AthleteEpreuve[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolveAthleteId = () => {
    if (typeof window === "undefined") return null
    try {
      const raw = localStorage.getItem("user")
      if (raw) {
        const parsed = JSON.parse(raw)
        const candidate = parsed.athleteId ?? parsed.id ?? parsed.userId ?? parsed.sub
        if (candidate != null) {
          const n = Number(candidate)
          if (!Number.isNaN(n)) return n
        }

        const nameCandidate = parsed.username || parsed.name
        if (nameCandidate) {
          const normalized = String(nameCandidate).trim().toLowerCase()
          const match = db.athletes.find((athlete) => {
            const full = `${athlete.prenom} ${athlete.nom}`.trim().toLowerCase()
            return full === normalized || athlete.prenom.toLowerCase() === normalized || athlete.nom.toLowerCase() === normalized
          })
          if (match) return match.id
        }
      }
    } catch (e) {
      // ignore
    }
    return db.athletes[0]?.id ?? null
  }

  const loadEpreuves = async (id: number) => {
    try {
      setLoading(true)
      setError(null)

      const athleteLinks = db.athleteEpreuves.filter((link) => link.athleteId === id)
      const athleteEpreuveIds = new Set(athleteLinks.map((link) => link.epreuveId))
      const list = db.epreuves.filter((epreuve) => athleteEpreuveIds.has(epreuve.id))
      setEpreuves(list)
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
      const aTime = getDateTime(a.date, a.heureDebut || "00:00").getTime()
      const bTime = getDateTime(b.date, b.heureDebut || "00:00").getTime()
      return aTime - bTime
    })
  }, [epreuves])

  const epreuvesByDate = useMemo(() => {
    return sortedEpreuves.reduce<Record<string, AthleteEpreuve[]>>((acc, epreuve) => {
      if (!acc[epreuve.date]) {
        acc[epreuve.date] = []
      }
      acc[epreuve.date].push(epreuve)
      return acc
    }, {})
  }, [sortedEpreuves])

  const hasOverlap = (current: AthleteEpreuve, list: AthleteEpreuve[]) => {
    if (!current.heureDebut || !current.heureFin) return false
    const start = getDateTime(current.date, current.heureDebut).getTime()
    const end = getDateTime(current.date, current.heureFin).getTime()

    return list.some((other) => {
      if (other.id === current.id) return false
      if (other.date !== current.date) return false
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
                <Button onClick={loadEpreuves} className="mt-4">
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
                        {new Date(date).toLocaleDateString("fr-FR", {
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
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {epreuve.heureDebut} - {epreuve.heureFin}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-4 w-4" />
                                      {epreuve.lieu}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <Badge variant="outline">{getTypeEpreuveLabel(epreuve.typeEpreuve)}</Badge>
                                    <Badge variant="secondary">{getNiveauEpreuveLabel(epreuve.niveauEpreuve)}</Badge>
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
