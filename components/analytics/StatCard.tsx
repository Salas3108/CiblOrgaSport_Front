// components/analytics/StatCard.tsx

'use client'

interface StatCardProps {
  label: string
  value: string
  trend?: number
  icon: string
  color: 'green' | 'emerald' | 'orange' | 'purple'
  loading?: boolean
}

const COLOR_MAP = {
  green:   { bg: 'bg-green-50',   icon: 'bg-green-100 text-green-600',   value: 'text-green-700',   bar: 'bg-green-400' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600', value: 'text-emerald-700', bar: 'bg-emerald-400' },
  orange:  { bg: 'bg-orange-50',  icon: 'bg-orange-100 text-orange-600',  value: 'text-orange-700',  bar: 'bg-orange-400' },
  purple:  { bg: 'bg-purple-50',  icon: 'bg-purple-100 text-purple-600',  value: 'text-purple-700',  bar: 'bg-purple-400' },
}

export default function StatCard({ label, value, trend, icon, color, loading }: Readonly<StatCardProps>) {
  const c = COLOR_MAP[color]

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100" />
          <div className="w-12 h-5 rounded-full bg-gray-100" />
        </div>
        <div className="w-20 h-8 rounded-lg bg-gray-100 mb-2" />
        <div className="w-28 h-3 rounded bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
      {/* Accent bar top */}
      <div className={`h-1 w-12 ${c.bar} rounded-full mb-4`} />

      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${c.icon}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            trend >= 0 ? 'text-green-700 bg-green-50 border border-green-100' : 'text-red-600 bg-red-50 border border-red-100'
          }`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      <p className={`text-3xl font-bold mb-1 ${c.value}`}>{value}</p>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
    </div>
  )
}
