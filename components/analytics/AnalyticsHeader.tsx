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
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Titre */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white text-lg">📊</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">Analytics & Reporting</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {lastUpdated
                ? `Mise à jour à ${formatTime(lastUpdated)}`
                : 'Chargement…'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de période */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onPeriodChange(value)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  currentPeriod === value
                    ? 'bg-white text-green-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-800'
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
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700 hover:bg-green-50 transition-colors"
          >
            Ouvrir Metabase ↗
          </a>

          {/* Export PDF */}
          <a
            href={`${METABASE_BASE_URL}/dashboard/1.pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium transition-colors shadow-sm"
          >
            ⬇ Exporter PDF
          </a>
        </div>
      </div>
    </div>
  )
}
