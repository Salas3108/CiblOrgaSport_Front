// components/analytics/FullscreenModal.tsx

'use client'

import { useEffect } from 'react'
import { METABASE_BASE_URL } from '@/config/metabaseConfig'

interface FullscreenModalProps {
  isOpen: boolean
  onClose: () => void
  iframeUrl: string
  title: string
}

export default function FullscreenModal({ isOpen, onClose, iframeUrl, title }: Readonly<FullscreenModalProps>) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const fullUrl = iframeUrl.startsWith('http') ? iframeUrl : `${METABASE_BASE_URL}${iframeUrl}`

  return (
    <div className="fixed inset-0 z-3000 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 shrink-0 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-2 h-6 bg-green-500 rounded-full" />
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-green-700 hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            Ouvrir dans Metabase ↗
          </a>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors text-lg font-medium"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1 bg-gray-50">
        <iframe
          src={fullUrl}
          className="w-full h-full border-0"
          title={title}
          loading="lazy"
        />
      </div>
    </div>
  )
}
