// components/analytics/AnalyticsHeader.tsx

'use client'

import { METABASE_BASE_URL } from '@/config/metabaseConfig'
import type { Period } from '@/types/analytics'

interface AnalyticsHeaderProps {
  currentPeriod: Period
  onPeriodChange: (period: Period) => void
  lastUpdated: Date | null
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today',  label: "Aujourd'hui" },
  { value: '7d',     label: '7 jours' },
  { value: '30d',    label: '30 jours' },
  { value: 'custom', label: 'Personnalisé' },
]

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function AnalyticsHeader({ currentPeriod, onPeriodChange, lastUpdated }: Readonly<AnalyticsHeaderProps>) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700/50 shadow-lg px-6 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Titre */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <span className="text-emerald-400 text-lg">📊</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Analytics & Reporting</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {lastUpdated
                ? `Mise à jour à ${formatTime(lastUpdated)}`
                : 'Chargement…'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de période */}
          <div className="flex bg-slate-800 rounded-xl p-1 gap-0.5">
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onPeriodChange(value)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  currentPeriod === value
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Ouvrir Metabase */}
          <a
            href={METABASE_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-slate-700 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
          >
            Ouvrir Metabase ↗
          </a>

          {/* Export PDF */}
          <a
            href={`${METABASE_BASE_URL}/dashboard/4.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-sm"
          >
            ⬇ Exporter PDF
          </a>
        </div>
      </div>
    </div>
  )
}
