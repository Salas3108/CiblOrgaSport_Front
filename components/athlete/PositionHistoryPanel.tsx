// src/components/athlete/PositionHistoryPanel.tsx
// Panneau latéral glissant affichant l'historique de positions d'un athlète.

'use client';

import { useEffect, useState } from 'react';
import { getAthleteHistory } from '@/api/geoService';
import type { PositionResponse } from '@/types/geo';

interface PositionHistoryPanelProps {
  athleteId: number;
  onClose: () => void;
}

function formatTimestamp(ts: string): string {
  try {
    // "2026-03-07T20:27:07.579985" → format local
    const date = new Date(ts);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return ts;
  }
}

export default function PositionHistoryPanel({
  athleteId,
  onClose,
}: PositionHistoryPanelProps) {
  const [history, setHistory] = useState<PositionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dates pour filtrage (aujourd'hui par défaut)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [dateDebut, setDateDebut] = useState(
    todayStart.toISOString().slice(0, 16)   // "YYYY-MM-DDTHH:MM"
  );
  const [dateFin, setDateFin] = useState(
    new Date().toISOString().slice(0, 16)
  );

  async function fetchHistory() {
    setIsLoading(true);
    setError(null);
    try {
      // Format ISO-8601 sans timezone : "2026-03-07T00:00:00"
      const debut = dateDebut.replace('T', 'T').slice(0, 16) + ':00';
      const fin = dateFin.replace('T', 'T').slice(0, 16) + ':00';
      const data = await getAthleteHistory(athleteId, debut, fin);
      setHistory(data);
    } catch {
      setError("Impossible de charger l'historique.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteId]);

  return (
    /* Overlay — z-2000 pour passer au-dessus de Leaflet (z ~1000) */
    <div className="fixed inset-0 z-2000 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panneau */}
      <aside className="relative z-10 w-full max-w-md bg-white text-gray-900 flex flex-col h-full shadow-2xl border-l border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Historique</h2>
            <p className="text-sm text-gray-500">Athlète #{athleteId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl leading-none transition-colors"
            aria-label="Fermer le panneau"
          >
            ×
          </button>
        </div>

        {/* Filtres dates */}
        <div className="px-5 py-3 border-b border-gray-100 space-y-2 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Début</label>
              <input
                type="datetime-local"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fin</label>
              <input
                type="datetime-local"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={fetchHistory}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded px-3 py-1.5 transition-colors"
          >
            Actualiser
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm text-center py-4">{error}</p>
          )}

          {!isLoading && !error && history.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">
              Aucune position enregistrée sur cette période.
            </p>
          )}

          {!isLoading && !error && history.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-3">
                {history.length} position{history.length > 1 ? 's' : ''}
              </p>
              {history.map((pos) => (
                <div
                  key={pos.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-sm"
                >
                  <p className="text-gray-500 text-xs mb-1">
                    🕐 {formatTimestamp(pos.timestamp)}
                  </p>
                  <p className="font-mono text-blue-600 text-xs">
                    {pos.latitude.toFixed(6)}, {pos.longitude.toFixed(6)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
