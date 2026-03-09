// app/admin/analytics/page.tsx
// Page principale Analytics — intègre les graphiques Metabase via iframes.
// Détecte si Metabase est disponible et affiche un état dégradé si non.

'use client'

import { useEffect, useState } from 'react'
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader'
import StatsGrid from '@/components/analytics/StatsGrid'
import MetabaseFrame from '@/components/analytics/MetabaseFrame'
import { METABASE_BASE_URL, METABASE_CHARTS } from '@/config/metabaseConfig'
import type { MetabaseChart, Period } from '@/types/analytics'

// ── Configuration des 6 graphiques ──────────────────────────────────────────
const CHARTS: MetabaseChart[] = [
  {
    key: 'daily_connections',
    url: METABASE_CHARTS.daily_connections,
    title: 'Connexions journalières',
    description: 'Nombre de connexions par jour',
    colSpan: 2,
    height: 320,
  },
  {
    key: 'role_distribution',
    url: METABASE_CHARTS.role_distribution,
    title: 'Utilisateurs par rôle',
    description: 'Répartition athlètes / spectateurs / volontaires',
    colSpan: 1,
    height: 360,
  },
  {
    key: 'notifications',
    url: METABASE_CHARTS.notifications,
    title: 'Notifications envoyées',
    description: 'Par type : résultats / sécurité / événements',
    colSpan: 1,
    height: 360,
  },
  {
    key: 'top_competitions',
    url: METABASE_CHARTS.top_competitions,
    title: 'Compétitions les plus suivies',
    description: 'Top 5 sur la période sélectionnée',
    colSpan: 1,
    height: 360,
  },
  {
    key: 'session_duration',
    url: METABASE_CHARTS.session_duration,
    title: 'Temps moyen par session',
    description: 'En minutes, sur la période',
    colSpan: 1,
    height: 360,
  },
  {
    key: 'weekly_summary',
    url: METABASE_CHARTS.weekly_summary,
    title: 'Récapitulatif hebdomadaire',
    description: 'Toutes les métriques clés par semaine',
    colSpan: 2,
    height: 400,
  },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('today')
  const [metabaseAvailable, setMetabaseAvailable] = useState<boolean | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Détection disponibilité Metabase
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    fetch(`${METABASE_BASE_URL}/api/health`, { signal: controller.signal, mode: 'no-cors' })
      .then(() => setMetabaseAvailable(true))
      .catch(() => setMetabaseAvailable(false))
      .finally(() => clearTimeout(timeout))
  }, [])

  // Horodatage dernière mise à jour
  useEffect(() => {
    setLastUpdated(new Date())
    const interval = setInterval(() => setLastUpdated(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-6 space-y-6">

      {/* Bannière Metabase hors-ligne */}
      {metabaseAvailable === false && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-3 text-sm">
          <span className="text-lg">⚠️</span>
          <div>
            <span className="font-semibold">Metabase non accessible</span>
            <span className="ml-2">—</span>
            <span className="ml-2">Vérifiez que Docker tourne sur {METABASE_BASE_URL}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto shrink-0 text-xs px-3 py-1.5 rounded-lg border border-orange-300 hover:bg-orange-100 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* En-tête */}
      <AnalyticsHeader
        currentPeriod={period}
        onPeriodChange={setPeriod}
        lastUpdated={lastUpdated}
      />

      {/* StatCards temps réel */}
      <StatsGrid />

      {/* Grille de graphiques Metabase */}
      {metabaseAvailable !== null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHARTS.map((chart) => (
            <MetabaseFrame
              key={chart.key}
              title={chart.title}
              description={chart.description}
              iframeUrl={chart.url}
              colSpan={chart.colSpan}
              height={chart.height}
              metabaseAvailable={metabaseAvailable}
            />
          ))}
        </div>
      )}

      {/* Loader initial */}
      {metabaseAvailable === null && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CHARTS.map((chart) => (
            <div
              key={chart.key}
              className={`bg-gray-100 border border-gray-200 rounded-2xl animate-pulse ${chart.colSpan === 2 ? 'md:col-span-2' : ''}`}
              style={{ height: chart.height }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
