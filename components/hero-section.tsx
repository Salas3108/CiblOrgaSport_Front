"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Waves } from "lucide-react"
import { listCompetitions, listEpreuves, listLieux } from "@/src/api/eventService"

const FALLBACK_ATHLETES = "150+"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://137.74.133.131"

type HeroStats = {
  athletes: string
  events: string
  venues: string
  countries: string
  dateLabel: string
  dateSubLabel: string
  locationTitle: string
  locationSubtitle: string
  nextEventTitle: string
  nextEventEta: string
}

const DEFAULT_STATS: HeroStats = {
  athletes: FALLBACK_ATHLETES,
  events: "-",
  venues: "-",
  countries: "-",
  dateLabel: "Calendrier en cours",
  dateSubLabel: "Données en temps réel",
  locationTitle: "Lieu principal",
  locationSubtitle: "Chargement...",
  nextEventTitle: "Prochaine épreuve à confirmer",
  nextEventEta: "Bientôt",
}

const toArray = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== "object") return []
  const data = payload as Record<string, unknown>
  if (Array.isArray(data.data)) return data.data as T[]
  if (Array.isArray(data.items)) return data.items as T[]
  if (Array.isArray(data.epreuves)) return data.epreuves as T[]
  if (Array.isArray(data.lieux)) return data.lieux as T[]
  if (Array.isArray(data.competitions)) return data.competitions as T[]
  return []
}

const parseDateCandidate = (item: any): Date | null => {
  const dateHeure = item?.dateHeure ?? item?.dateTime ?? item?.startDateTime
  if (typeof dateHeure === "string") {
    const dt = new Date(dateHeure)
    if (!Number.isNaN(dt.getTime())) return dt
  }

  const date = item?.date ?? item?.dateDebut ?? item?.startDate
  const heure = item?.heureDebut ?? item?.time ?? "00:00"

  if (typeof date === "string") {
    const dt = new Date(`${date}T${heure}`)
    if (!Number.isNaN(dt.getTime())) return dt
  }

  return null
}

const formatEta = (date: Date): string => {
  const diffMs = date.getTime() - Date.now()
  if (diffMs <= 0) return "En cours"

  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  if (diffHours < 24) return `Dans ${Math.max(diffHours, 1)}h`

  const diffDays = Math.round(diffHours / 24)
  return `Dans ${Math.max(diffDays, 1)} jour${diffDays > 1 ? "s" : ""}`
}

async function getAthleteCountSafe(): Promise<string> {
  if (typeof window === "undefined") return FALLBACK_ATHLETES

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken")

  if (!token) return FALLBACK_ATHLETES

  try {
    const res = await fetch(`${API_BASE_URL}/commissaire/athletes/valides`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) return FALLBACK_ATHLETES
    const data = await res.json()
    const athletes = toArray<any>(data)
    return athletes.length > 0 ? athletes.length.toLocaleString("fr-FR") : FALLBACK_ATHLETES
  } catch {
    return FALLBACK_ATHLETES
  }
}

export function HeroSection() {
  const [stats, setStats] = useState<HeroStats>(DEFAULT_STATS)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const [epreuvesRaw, lieuxRaw, competitionsRaw, athletesCount] = await Promise.all([
          listEpreuves().catch(() => []),
          listLieux().catch(() => []),
          listCompetitions().catch(() => []),
          getAthleteCountSafe(),
        ])

        if (!mounted) return

        const epreuves = toArray<any>(epreuvesRaw)
        const lieux = toArray<any>(lieuxRaw)
        const competitions = toArray<any>(competitionsRaw)

        const paysSet = new Set(
          competitions
            .map((c) => c?.paysHote ?? c?.country ?? c?.pays)
            .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
            .map((v) => v.trim().toLowerCase())
        )

        const now = Date.now()
        const nextEpreuve = epreuves
          .map((e) => ({ epreuve: e, date: parseDateCandidate(e) }))
          .filter((x): x is { epreuve: any; date: Date } => Boolean(x.date))
          .filter((x) => x.date.getTime() >= now)
          .sort((a, b) => a.date.getTime() - b.date.getTime())[0]

        const nextEventTitle =
          nextEpreuve?.epreuve?.nom ?? nextEpreuve?.epreuve?.epreuveNom ?? "Prochaine épreuve à confirmer"
        const nextEventEta = nextEpreuve ? formatEta(nextEpreuve.date) : "Bientôt"

        const mainCompetition = competitions[0]
        const mainDate = parseDateCandidate(mainCompetition)

        const dateLabel = mainDate
          ? mainDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
          : "Calendrier en cours"

        const dateSubLabel = `${competitions.length.toLocaleString("fr-FR")} compétition${competitions.length > 1 ? "s" : ""}`

        const locationTitle = (mainCompetition?.ville ?? mainCompetition?.city ?? mainCompetition?.paysHote ?? "Lieu principal") as string

        setStats({
          athletes: athletesCount,
          events: epreuves.length.toLocaleString("fr-FR"),
          venues: lieux.length.toLocaleString("fr-FR"),
          countries: paysSet.size > 0 ? paysSet.size.toLocaleString("fr-FR") : "-",
          dateLabel,
          dateSubLabel,
          locationTitle,
          locationSubtitle: mainCompetition?.name ?? mainCompetition?.nomCompetition ?? "Centre sportif",
          nextEventTitle,
          nextEventEta,
        })
      } catch {
        if (!mounted) return
        setStats(DEFAULT_STATS)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  const statItems = useMemo(
    () => [
      { label: "Athlètes", value: stats.athletes },
      { label: "Épreuves", value: stats.events },
      { label: "Lieux", value: stats.venues },
    ],
    [stats]
  )

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <Waves className="h-3 w-3 mr-1" />
                Live Event
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-balance">
                European Swimming Championships
                <span className="text-primary block">2026</span>
              </h1>
              <p className="text-xl text-muted-foreground text-pretty">
                The official platform for athletes, officials, spectators, and volunteers. Track events, view results,
                and stay connected in real-time.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Access Dashboard
              </Button>
              <Button variant="outline" size="lg">
                View Schedule
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              {statItems.map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-2xl font-bold text-primary">{item.value}</div>
                  <div className="text-sm text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-6 bg-card/50 backdrop-blur">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Event Information</h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{stats.dateLabel}</div>
                    <div className="text-sm text-muted-foreground">{stats.dateSubLabel}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{stats.locationTitle}</div>
                    <div className="text-sm text-muted-foreground">{stats.locationSubtitle}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{stats.countries} pays</div>
                    <div className="text-sm text-muted-foreground">Nations participantes</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next Event</span>
                  <Badge variant="secondary">{stats.nextEventEta}</Badge>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{stats.nextEventTitle}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
