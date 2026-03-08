// src/app/commissaire/athletes/carte/page.tsx
// Commissaire real-time athlete tracking dashboard.
//
// Data strategy (two layers):
// 1. REST  — GET /api/geo/athletes/{id}/position
//            Called once at load for each athlete → shows last known position immediately.
// 2. WebSocket (STOMP) — /topic/athletes/{id}
//            Pushes live updates as athletes move → overrides REST position in real time.
//
// Athlete list comes from GET /api/commissaire/athletes (Spring Boot :8080).

'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useAthletePositions } from '@/hooks/useAthletePositions';
import { getAthleteLastPosition } from '@/api/geoService';
import PositionHistoryPanel from '@/components/athlete/PositionHistoryPanel';
import type { WebSocketPositionMessage } from '@/types/geo';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token') ?? localStorage.getItem('accessToken') ?? '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface Athlete {
  id: number;
  nom: string;
  prenom: string;
}

const MapComponent = dynamic(() => import('@/components/map/MapComponent'), { ssr: false });
const AthleteMarker = dynamic(() => import('@/components/map/AthleteMarker'), { ssr: false });

const OFFLINE_THRESHOLD_MS = 30_000;
const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

function CartePage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loadingAthletes, setLoadingAthletes] = useState(true);

  // Last known positions from REST (initial snapshot)
  const [restPositions, setRestPositions] = useState<Map<number, WebSocketPositionMessage>>(new Map());

  const athleteIds = useMemo(() => athletes.map((a) => a.id), [athletes]);
  const athleteNames = useMemo(() => {
    const map = new Map<number, string>();
    athletes.forEach((a) => map.set(a.id, `${a.prenom} ${a.nom}`));
    return map;
  }, [athletes]);

  // WebSocket live positions (overrides REST when received)
  const { positions: wsPositions, isConnected, error } = useAthletePositions(athleteIds);

  const [historyAthleteId, setHistoryAthleteId] = useState<number | null>(null);
  const [hoveredAthleteId, setHoveredAthleteId] = useState<number | null>(null);

  // ── Step 1: load athlete list ────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/commissaire/athletes`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data: Athlete[]) => {
        setAthletes(data);
        setLoadingAthletes(false);
      })
      .catch(() => setLoadingAthletes(false));
  }, []);

  // ── Step 2: fetch last known position for each athlete (REST) ────────────
  useEffect(() => {
    if (athleteIds.length === 0) return;

    Promise.allSettled(
      athleteIds.map((id) =>
        getAthleteLastPosition(id).then((pos) => ({ id, pos }))
      )
    ).then((results) => {
      setRestPositions((prev) => {
        const next = new Map(prev);
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            const { id, pos } = r.value;
            next.set(id, {
              athleteId: pos.athleteId,
              latitude: pos.latitude,
              longitude: pos.longitude,
              timestamp: pos.timestamp,
            });
          }
        });
        return next;
      });
    });
  }, [athleteIds]);

  // ── Merge: WebSocket takes priority over REST ────────────────────────────
  const positions = useMemo<Map<number, WebSocketPositionMessage>>(() => {
    const merged = new Map(restPositions);
    wsPositions.forEach((pos, id) => merged.set(id, pos));
    return merged;
  }, [restPositions, wsPositions]);

  // Timestamp map for offline detection
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

  if (loadingAthletes) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-400">
        Chargement des athlètes…
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* ── WebSocket status banner ── */}
      {!isConnected && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-700 text-white text-sm text-center py-2 px-4">
          ⚠️ WebSocket déconnecté — positions en cache REST uniquement
          {error && <span className="ml-2 opacity-75">({error})</span>}
        </div>
      )}

      {/* ── Map ── */}
      <main className={`flex-1 relative ${!isConnected ? 'pt-9' : ''}`}>
        <MapComponent center={PARIS_CENTER} zoom={13} className="h-full">
          {athleteIds.map((id) => (
            <AthleteMarker
              key={id}
              athleteId={id}
              name={athleteNames.get(id)}
              position={positions.get(id) ?? null}
              lastUpdateMs={lastUpdateMs.get(id) ?? null}
              onClick={() => setHistoryAthleteId(id)}
            />
          ))}
        </MapComponent>
      </main>

      {/* ── Side panel ── */}
      <aside className="w-72 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-700">
          <h1 className="text-lg font-bold text-white">Suivi athlètes</h1>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-xs text-gray-400">
                {isConnected ? 'Temps réel (WebSocket)' : 'Cache REST'}
              </span>
            </div>
            <span className="text-xs text-gray-500">{athletes.length} athlètes</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {athletes.length === 0 ? (
            <p className="text-xs text-gray-600 text-center pt-8">Aucun athlète trouvé</p>
          ) : (
            athletes.map(({ id }) => {
              const offline = isOffline(id);
              const pos = positions.get(id);
              const isWsLive = wsPositions.has(id);
              return (
                <div
                  key={id}
                  className={`rounded-xl p-3 border cursor-pointer transition-all ${
                    hoveredAthleteId === id
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  onMouseEnter={() => setHoveredAthleteId(id)}
                  onMouseLeave={() => setHoveredAthleteId(null)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${offline ? 'bg-red-500' : 'bg-green-400 animate-pulse'}`} />
                    <span className="font-semibold text-sm text-white truncate">
                      {athleteNames.get(id) ?? `Athlète #${id}`}
                    </span>
                    {offline ? (
                      <span className="ml-auto text-xs text-red-400 font-medium shrink-0">Hors ligne</span>
                    ) : isWsLive ? (
                      <span className="ml-auto text-xs text-green-400 shrink-0">Live</span>
                    ) : (
                      <span className="ml-auto text-xs text-yellow-500 shrink-0">Cache</span>
                    )}
                  </div>
                  {pos ? (
                    <p className="text-xs font-mono text-gray-400 ml-5">
                      {pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 ml-5">Aucune position</p>
                  )}
                  <button
                    onClick={() => setHistoryAthleteId(id)}
                    className="mt-2 ml-5 text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    Voir historique →
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Legend */}
        <div className="px-5 py-4 border-t border-gray-700 space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400 shrink-0" />
            Actif — position &lt; 30 s
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
            Hors ligne — &gt; 30 s
          </div>
          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-800">
            <span className="text-green-400">Live</span> = WebSocket actif
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">Cache</span> = dernière position REST
          </div>
        </div>
      </aside>

      {historyAthleteId !== null && (
        <PositionHistoryPanel
          athleteId={historyAthleteId}
          onClose={() => setHistoryAthleteId(null)}
        />
      )}
    </div>
  );
}

export default function CartePageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-400">
          Chargement…
        </div>
      }
    >
      <CartePage />
    </Suspense>
  );
}
