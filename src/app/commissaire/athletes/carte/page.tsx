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
      <div className="flex-1 flex items-center justify-center bg-white text-gray-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Chargement des athlètes…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-white overflow-hidden">
      {/* ── Top bar ── */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📍</span>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">Suivi athlètes</h1>
            <p className="text-xs text-gray-400">Commissaire — temps réel</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600">
            {athletes.length} athlètes
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-500">
            {isConnected ? 'WebSocket actif' : 'Cache REST'}
          </span>
          {!isConnected && error && (
            <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">{error}</span>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <main className="flex-1 relative p-3">
          <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
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
          </div>
        </main>

        {/* Side panel */}
        <aside className="w-72 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs text-gray-500">Cliquez sur un athlète pour voir l'historique</p>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {athletes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center pt-8">Aucun athlète trouvé</p>
            ) : (
              athletes.map(({ id }) => {
                const offline = isOffline(id);
                const pos = positions.get(id);
                const isWsLive = wsPositions.has(id);
                const name = athleteNames.get(id) ?? `Athlète #${id}`;
                return (
                  <button
                    key={id}
                    onClick={() => setHistoryAthleteId(id)}
                    onMouseEnter={() => setHoveredAthleteId(id)}
                    onMouseLeave={() => setHoveredAthleteId(null)}
                    className={`w-full text-left rounded-xl p-2.5 border transition-all ${
                      hoveredAthleteId === id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                        offline ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${offline ? 'bg-red-400' : 'bg-green-500 animate-pulse'}`} />
                          <span className="text-sm font-medium text-gray-800 truncate">{name}</span>
                        </div>
                        {pos ? (
                          <p className="text-xs font-mono text-gray-400 ml-3 truncate">
                            {pos.latitude.toFixed(4)}, {pos.longitude.toFixed(4)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-300 ml-3">Pas de position</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                        offline ? 'text-red-500 bg-red-50' :
                        isWsLive ? 'text-green-600 bg-green-50' :
                        'text-yellow-600 bg-yellow-50'
                      }`}>
                        {offline ? 'Off' : isWsLive ? 'Live' : 'Cache'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Actif</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Hors ligne</span>
            <span className="text-green-600 font-medium">Live</span>
            <span className="text-yellow-600 font-medium">Cache</span>
          </div>
        </aside>
      </div>

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
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-white text-gray-400">
        Chargement…
      </div>
    }>
      <CartePage />
    </Suspense>
  );
}
