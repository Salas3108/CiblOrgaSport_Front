// app/admin/analytics/page.tsx
// Page principale Analytics — intègre les graphiques Metabase via iframes.
// Détecte si Metabase est disponible et affiche un état dégradé si non.

'use client'

import { useEffect, useState } from 'react'
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader'
import MetabaseFrame from '@/components/analytics/MetabaseFrame'
import { METABASE_BASE_URL, METABASE_CHARTS } from '@/config/metabaseConfig'
import type { MetabaseChart, Period } from '@/types/analytics'

const MB = `${METABASE_BASE_URL}/embed/question`
const P = '#bordered=false&titled=false&theme=night'

const KPI_CARDS = [
  { key: 'kpi_connexions', title: 'Connexions', url: `${MB}/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJxdWVzdGlvbiI6NTJ9LCJwYXJhbXMiOnt9LCJleHAiOjk5OTk5OTk5OTk5fQ.LBUC9fmPMJ4TzBP0iosVA55SazRWyCiFclq019vB4uE${P}` },
  { key: 'kpi_users',      title: 'Utilisateurs', url: `${MB}/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJxdWVzdGlvbiI6NTN9LCJwYXJhbXMiOnt9LCJleHAiOjk5OTk5OTk5OTk5fQ.hS58N1T9tqQ0yiYS5jztE7-37AfX5DqCYOx0Khi5Uro${P}` },
  { key: 'kpi_notif',      title: 'Notifications', url: `${MB}/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJxdWVzdGlvbiI6NTR9LCJwYXJhbXMiOnt9LCJleHAiOjk5OTk5OTk5OTk5fQ.MxwSbPYdMYl_O6B1W4i-6B8_T_fJ6AzNiBtsto33vks${P}` },
  { key: 'kpi_session',    title: 'Temps moyen / session', url: `${MB}/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZSI6eyJxdWVzdGlvbiI6NTV9LCJwYXJhbXMiOnt9LCJleHAiOjk5OTk5OTk5OTk5fQ.Al_saY-pX7vrJ1MTwcU2UASb31m2_z7N4n_RCP3N8Cg${P}` },
]

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
    <div className="min-h-screen bg-slate-950 px-6 py-6 space-y-6">

      {/* Bannière Metabase hors-ligne */}
      {metabaseAvailable === false && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl px-4 py-3 text-sm">
          <span className="text-lg">⚠️</span>
          <div>
            <span className="font-semibold">Metabase non accessible</span>
            <span className="ml-2 text-amber-500/70">— Vérifiez que le serveur tourne sur {METABASE_BASE_URL}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto shrink-0 text-xs px-3 py-1.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/10 transition-colors"
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

      {/* KPIs Metabase */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => (
          <div key={kpi.key} className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg" style={{ height: 130 }}>
            <p className="text-[10px] font-semibold text-slate-400 px-4 pt-3 uppercase tracking-widest">{kpi.title}</p>
            {metabaseAvailable !== false && (
              <iframe src={kpi.url} className="w-full border-0" style={{ height: 90 }} title={kpi.title} loading="lazy" />
            )}
            {metabaseAvailable === false && (
              <div className="flex items-center justify-center h-20 text-slate-600 text-2xl font-light">—</div>
            )}
          </div>
        ))}
      </div>

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
              className={`bg-slate-900 border border-slate-700/50 rounded-2xl animate-pulse ${chart.colSpan === 2 ? 'md:col-span-2' : ''}`}
              style={{ height: chart.height }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
