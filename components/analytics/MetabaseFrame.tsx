// components/analytics/MetabaseFrame.tsx

'use client'

import { useState } from 'react'
import { METABASE_BASE_URL } from '@/config/metabaseConfig'
import FullscreenModal from './FullscreenModal'

interface MetabaseFrameProps {
  title: string
  description: string
  iframeUrl: string
  colSpan?: 1 | 2
  height?: number
  metabaseAvailable: boolean
}

export default function MetabaseFrame({
  title,
  description,
  iframeUrl,
  colSpan = 1,
  height = 400,
  metabaseAvailable,
}: Readonly<MetabaseFrameProps>) {
  const [loaded, setLoaded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  const fullUrl = iframeUrl.startsWith('http') ? iframeUrl : `${METABASE_BASE_URL}${iframeUrl}`

  return (
    <>
      <div
        className={`bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col shadow-lg hover:shadow-xl hover:border-slate-600/50 transition-all ${colSpan === 2 ? 'md:col-span-2' : ''}`}
        style={{ height }}
      >
        {/* Header carte */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2 h-5 bg-emerald-500 rounded-full shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{title}</p>
              <p className="text-xs text-slate-400 truncate">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-3">
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Ouvrir dans Metabase"
              className="h-7 px-2.5 flex items-center rounded-lg text-xs text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              ↗
            </a>
            <button
              onClick={() => setFullscreen(true)}
              title="Agrandir"
              className="h-7 px-2.5 flex items-center rounded-lg text-xs text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              ⛶
            </button>
          </div>
        </div>

        {/* Corps */}
        <div className="flex-1 relative overflow-hidden bg-slate-950">
          {/* Skeleton */}
          {!loaded && metabaseAvailable && (
            <div className="absolute inset-0 bg-slate-950 z-10 flex flex-col gap-3 p-5 animate-pulse">
              <div className="flex gap-3">
                <div className="h-4 bg-slate-800 rounded-full w-1/4" />
                <div className="h-4 bg-slate-800 rounded-full w-1/6" />
              </div>
              <div className="flex-1 flex items-end gap-2 px-2 pb-4">
                {[40, 65, 45, 80, 55, 70, 50, 90, 60, 75].map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-800 rounded-t-md" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="h-3 bg-slate-800 rounded-full w-1/3 mx-auto" />
            </div>
          )}

          {/* Hors-ligne */}
          {!metabaseAvailable ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-3xl">
                📊
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300">Metabase non disponible</p>
                <p className="text-xs text-slate-500 mt-1 font-mono">{METABASE_BASE_URL}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Réessayer
                </button>
                <a
                  href={METABASE_BASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  Ouvrir Metabase
                </a>
              </div>
            </div>
          ) : (
            <iframe
              src={fullUrl}
              className="w-full h-full border-0"
              title={title}
              loading="lazy"
              onLoad={() => setLoaded(true)}
            />
          )}
        </div>
      </div>

      <FullscreenModal
        isOpen={fullscreen}
        onClose={() => setFullscreen(false)}
        iframeUrl={iframeUrl}
        title={title}
      />
    </>
  )
}
