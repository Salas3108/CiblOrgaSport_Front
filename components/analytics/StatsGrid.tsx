// components/analytics/StatsGrid.tsx
// Grille des 4 StatCards (chiffres temps réel depuis Spring Boot).

'use client'

import { useEffect, useState } from 'react'
import StatCard from './StatCard'
import { getTodayStats } from '@/api/analyticsService'
import type { TodayStats } from '@/types/analytics'

function fmtNum(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

function fmtMin(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}h ${m}m`
}

export default function StatsGrid() {
  const [stats, setStats] = useState<TodayStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTodayStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Connexions aujourd'hui"
        value={stats ? fmtNum(stats.totalEvents) : '—'}
        trend={stats?.comparedToYesterday.connections}
        icon="⚡"
        color="green"
        loading={loading}
      />
      <StatCard
        label="Utilisateurs uniques"
        value={stats ? fmtNum(stats.uniqueUsers) : '—'}
        trend={stats?.comparedToYesterday.users}
        icon="👥"
        color="emerald"
        loading={loading}
      />
      <StatCard
        label="Notifications envoyées"
        value={stats ? fmtNum(stats.notificationsSent) : '—'}
        trend={stats?.comparedToYesterday.notifications}
        icon="🔔"
        color="orange"
        loading={loading}
      />
      <StatCard
        label="Temps moyen / session"
        value={stats ? fmtMin(stats.avgSessionMinutes) : '—'}
        icon="⏱️"
        color="purple"
        loading={loading}
      />
    </div>
  )
}
