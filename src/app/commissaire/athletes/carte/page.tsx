// src/app/commissaire/athletes/carte/page.tsx
// Tableau de bord commissaire : suivi temps réel des athlètes sur une carte.
// Thème sombre. WebSocket STOMP, un topic par athlète.

'use client';

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { useAthletePositions } from '@/hooks/useAthletePositions';
import PositionHistoryPanel from '@/components/athlete/PositionHistoryPanel';

// Import dynamique (Leaflet ne supporte pas SSR)
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), { ssr: false });
const AthleteMarker = dynamic(() => import('@/components/map/AthleteMarker'), { ssr: false });

// Athlètes à suivre : passés en query param ?ids=1,2,3 ou liste par défaut
function useAthleteIds(): number[] {
  const searchParams = useSearchParams();
  const raw = searchParams.get('ids');
  if (raw) {
    return raw
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
  }
  // Valeurs de démo si aucun paramètre
  return [1, 2, 3];
}

const OFFLINE_THRESHOLD_MS = 30_000;
const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

function CartePage() {
  const athleteIds = useAthleteIds();
  const { positions, isConnected, error } = useAthletePositions(athleteIds);
  const [historyAthleteId, setHistoryAthleteId] = useState<number | null>(null);
  const [hoveredAthleteId, setHoveredAthleteId] = useState<number | null>(null);

  // Calcule le timestamp epoch de la dernière mise à jour par athlète
  const lastUpdateMs = useMemo(() => {
    const map = new Map<number, number>();
    positions.forEach((pos, id) => {
      try {
        map.set(id, new Date(pos.timestamp).getTime());
      } catch {
        map.set(id, Date.now());
      }
    });
    return map;
  }, [positions]);

  function isOffline(athleteId: number): boolean {
    const ts = lastUpdateMs.get(athleteId);
    if (!ts) return true;
    return Date.now() - ts > OFFLINE_THRESHOLD_MS;
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* ── Bannière de reconnexion ── */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-700 text-white text-sm text-center py-2 px-4">
          ⚠️ WebSocket déconnecté — Reconnexion en cours…
          {error && <span className="ml-2 opacity-75">({error})</span>}
        </div>
      )}

      {/* ── Carte ── */}
      <main className={`flex-1 relative ${!isConnected ? 'pt-9' : ''}`}>
        <MapComponent center={PARIS_CENTER} zoom={13} className="h-full">
          {athleteIds.map((id) => {
            const pos = positions.get(id) ?? null;
            return (
              <AthleteMarker
                key={id}
                athleteId={id}
                position={pos}
                lastUpdateMs={lastUpdateMs.get(id) ?? null}
                onClick={() => setHistoryAthleteId(id)}
              />
            );
          })}
        </MapComponent>
      </main>

      {/* ── Panneau légende ── */}
      <aside className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700">
          <h1 className="text-lg font-bold text-white">Suivi athlètes</h1>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-500'}`}
            />
            <span className="text-xs text-gray-400">
              {isConnected ? 'Temps réel connecté' : 'Déconnecté'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {athleteIds.map((id) => {
            const offline = isOffline(id);
            const pos = positions.get(id);
            return (
              <div
                key={id}
                className={`
                  rounded-xl p-3 border cursor-pointer transition-all
                  ${hoveredAthleteId === id
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-700 hover:border-gray-500'
                  }
                `}
                onMouseEnter={() => setHoveredAthleteId(id)}
                onMouseLeave={() => setHoveredAthleteId(null)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`
                      w-2.5 h-2.5 rounded-full shrink-0
                      ${offline ? 'bg-red-500' : 'bg-green-400 animate-pulse'}
                    `}
                  />
                  <span className="font-semibold text-sm text-white">
                    Athlète #{id}
                  </span>
                  {offline && (
                    <span className="ml-auto text-xs text-red-400 font-medium">
                      Hors ligne
                    </span>
                  )}
                </div>
                {pos ? (
                  <p className="text-xs font-mono text-gray-400 ml-5">
                    {pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)}
                  </p>
                ) : (
                  <p className="text-xs text-gray-600 ml-5">Aucune position reçue</p>
                )}
                <button
                  onClick={() => setHistoryAthleteId(id)}
                  className="mt-2 ml-5 text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  Voir historique →
                </button>
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="px-5 py-4 border-t border-gray-700 space-y-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
            Athlète actif (position &lt; 30 s)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
            Athlète hors ligne (&gt; 30 s)
          </div>
        </div>
      </aside>

      {/* ── Panneau historique ── */}
      {historyAthleteId !== null && (
        <PositionHistoryPanel
          athleteId={historyAthleteId}
          onClose={() => setHistoryAthleteId(null)}
        />
      )}
    </div>
  );
}

// Wrapper Suspense requis par useSearchParams() dans App Router
export default function CartePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-400">
          Chargement de la carte…
        </div>
      }
    >
      <CartePage />
    </Suspense>
  );
}
