"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Calendar, Trophy, MapPin, Bell } from "lucide-react"
import { getTodayStats } from "@/api/analyticsService"
import type { TodayStats } from "@/types/analytics"

type StatCard = {
  title: string
  value: string
  change: string
  trend: "up" | "neutral"
  icon: typeof Users
  description: string
}

const FALLBACK_STATS: StatCard[] = [
  {
    title: "Utilisateurs actifs",
    value: "-",
    change: "Donnée indisponible",
    trend: "neutral",
    icon: Users,
    description: "Connectés aujourd'hui",
  },
  {
    title: "Événements aujourd'hui",
    value: "-",
    change: "Donnée indisponible",
    trend: "neutral",
    icon: Calendar,
    description: "Compétitions prévues",
  },
  {
    title: "Notifications envoyées",
    value: "-",
    change: "Donnée indisponible",
    trend: "neutral",
    icon: Bell,
    description: "Mises à jour temps réel",
  },
  {
    title: "Session moyenne",
    value: "-",
    change: "Donnée indisponible",
    trend: "neutral",
    icon: Trophy,
    description: "Durée moyenne (min)",
  },
  {
    title: "Utilisateurs vs hier",
    value: "-",
    change: "Donnée indisponible",
    trend: "neutral",
    icon: TrendingUp,
    description: "Variation en %",
  },
  {
    title: "Connexions vs hier",
    value: "-",
    change: "Donnée indisponible",
    trend: "neutral",
    icon: MapPin,
    description: "Variation en %",
  },
]

const formatDelta = (value: number | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-"
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
}

const trendFromDelta = (value: number | undefined): "up" | "neutral" => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "neutral"
  return value >= 0 ? "up" : "neutral"
}

const formatNumber = (value: number | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-"
  return value.toLocaleString("fr-FR")
}

const formatMinutes = (value: number | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-"
  return `${value.toFixed(1)} min`
}

export function QuickStats() {
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadStats = async () => {
      try {
        setLoading(true)
        const data = await getTodayStats()
        if (!mounted) return
        setTodayStats(data)
      } catch {
        if (!mounted) return
        setTodayStats(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadStats()
    return () => {
      mounted = false
    }
  }, [])

  const stats = useMemo<StatCard[]>(() => {
    if (!todayStats) return FALLBACK_STATS

    return [
      {
        title: "Utilisateurs actifs",
        value: formatNumber(todayStats.uniqueUsers),
        change: formatDelta(todayStats.comparedToYesterday?.users),
        trend: trendFromDelta(todayStats.comparedToYesterday?.users),
        icon: Users,
        description: "Connectés aujourd'hui",
      },
      {
        title: "Événements aujourd'hui",
        value: formatNumber(todayStats.totalEvents),
        change: "Temps réel",
        trend: "up",
        icon: Calendar,
        description: "Compétitions prévues",
      },
      {
        title: "Notifications envoyées",
        value: formatNumber(todayStats.notificationsSent),
        change: formatDelta(todayStats.comparedToYesterday?.notifications),
        trend: trendFromDelta(todayStats.comparedToYesterday?.notifications),
        icon: Bell,
        description: "Mises à jour temps réel",
      },
      {
        title: "Session moyenne",
        value: formatMinutes(todayStats.avgSessionMinutes),
        change: "Aujourd'hui",
        trend: "neutral",
        icon: Trophy,
        description: "Durée moyenne",
      },
      {
        title: "Utilisateurs vs hier",
        value: formatDelta(todayStats.comparedToYesterday?.users),
        change: "Variation",
        trend: trendFromDelta(todayStats.comparedToYesterday?.users),
        icon: TrendingUp,
        description: "Comparaison journalière",
      },
      {
        title: "Connexions vs hier",
        value: formatDelta(todayStats.comparedToYesterday?.connections),
        change: "Variation",
        trend: trendFromDelta(todayStats.comparedToYesterday?.connections),
        icon: MapPin,
        description: "Comparaison journalière",
      },
    ]
  }, [todayStats])

  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Championship Statistics</h2>
        <p className="text-muted-foreground">
          {loading ? "Chargement des statistiques en temps réel..." : "Insights en temps réel du championnat"}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                    <Badge
                      variant={stat.trend === "up" ? "default" : "secondary"}
                      className={stat.trend === "up" ? "bg-accent" : ""}
                    >
                      {stat.change}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
