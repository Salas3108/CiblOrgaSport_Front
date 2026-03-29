// src/app/admin/athletes/carte/page.tsx

'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useAthletePositions } from '@/hooks/useAthletePositions';
import { getAthleteLastPosition } from '@/api/geoService';
import PositionHistoryPanel from '@/components/athlete/PositionHistoryPanel';
import type { WebSocketPositionMessage } from '@/types/geo';

const ADMIN_API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://137.74.133.131';

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token') ?? localStorage.getItem('accessToken') ?? '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface AdminAthlete {
  id: number;
  username: string;
  email: string;
  validated: boolean;
}

const MapComponent = dynamic(() => import('@/components/map/MapComponent'), { ssr: false });
const AthleteMarker = dynamic(() => import('@/components/map/AthleteMarker'), { ssr: false });

const OFFLINE_THRESHOLD_MS = 30_000;
const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

function initials(username: string) {
  return username.slice(0, 2).toUpperCase();
}

function AdminCartePage() {
  const [athletes, setAthletes] = useState<AdminAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'validated' | 'pending'>('all');
  const [restPositions, setRestPositions] = useState<Map<number, WebSocketPositionMessage>>(new Map());
  const [historyAthleteId, setHistoryAthleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  // ── Load athletes ──────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    let url = `${ADMIN_API}/auth/admin/athletes`;
    if (filter === 'validated') url += '?validated=true';
    if (filter === 'pending') url += '?validated=false';

    fetch(url, { headers: getAuthHeaders() })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data: AdminAthlete[]) => { setAthletes(data); setLoading(false); })
      .catch((e) => { setLoadError(`Erreur : ${e.message}`); setLoading(false); });
  }, [filter]);

  const athleteIds = useMemo(() => athletes.map((a) => a.id), [athletes]);

  const { positions: wsPositions, isConnected, error: wsError } = useAthletePositions(athleteIds);

  useEffect(() => {
    if (athleteIds.length === 0) return;
    Promise.allSettled(
      athleteIds.map((id) => getAthleteLastPosition(id).then((pos) => ({ id, pos })))
    ).then((results) => {
      setRestPositions((prev) => {
        const next = new Map(prev);
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            const { id, pos } = r.value;
            next.set(id, { athleteId: pos.athleteId, latitude: pos.latitude, longitude: pos.longitude, timestamp: pos.timestamp });
          }
        });
        return next;
      });
    });
  }, [athleteIds]);

  const positions = useMemo<Map<number, WebSocketPositionMessage>>(() => {
    const merged = new Map(restPositions);
    wsPositions.forEach((pos, id) => merged.set(id, pos));
    return merged;
  }, [restPositions, wsPositions]);

  const lastUpdateMs = useMemo(() => {
    const map = new Map<number, number>();
    positions.forEach((pos, id) => {
      try { map.set(id, new Date(pos.timestamp).getTime()); } catch { map.set(id, Date.now()); }
    });
    return map;
  }, [positions]);

  function isOffline(id: number) {
    const ts = lastUpdateMs.get(id);
    return !ts || Date.now() - ts > OFFLINE_THRESHOLD_MS;
  }

  const filteredAthletes = useMemo(() =>
    athletes.filter((a) =>
      a.username.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
    ), [athletes, search]);

  const onlineCount = athleteIds.filter((id) => !isOffline(id)).length;
  const withPositionCount = athleteIds.filter((id) => positions.has(id)).length;

  if (loading) {
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

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🗺️</span>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">Géolocalisation athlètes</h1>
            <p className="text-xs text-gray-400">Administration — temps réel</p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <span className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600">
            {athletes.length} athlètes
          </span>
          <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1 text-xs text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {onlineCount} actifs
          </span>
          <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs text-blue-700">
            📍 {withPositionCount} localisés
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-orange-400'}`} />
          <span className="text-xs text-gray-500">
            {isConnected ? 'WebSocket actif' : 'Cache REST'}
          </span>
          {!isConnected && wsError && (
            <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
              {wsError}
            </span>
          )}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Map */}
        <main className="flex-1 relative p-3">
          <div className="w-full h-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <MapComponent center={PARIS_CENTER} zoom={13} className="h-full">
              {athletes.map(({ id, username }) => (
                <AthleteMarker
                  key={id}
                  athleteId={id}
                  name={username}
                  position={positions.get(id) ?? null}
                  lastUpdateMs={lastUpdateMs.get(id) ?? null}
                  onClick={() => setHistoryAthleteId(id)}
                />
              ))}
            </MapComponent>
          </div>
        </main>

        {/* Side panel */}
        <aside className="w-80 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 space-y-2.5">
            {/* Filter tabs */}
            <div className="flex rounded-lg bg-gray-100 p-1 gap-1 text-xs">
              {(['all', 'validated', 'pending'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1 rounded-md font-medium transition-colors ${
                    filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {f === 'all' ? 'Tous' : f === 'validated' ? 'Validés' : 'En attente'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white"
              />
            </div>
          </div>

          {/* Athlete list */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {loadError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 mb-2">
                {loadError}
              </div>
            )}
            {filteredAthletes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center pt-10">Aucun athlète trouvé</p>
            ) : (
              filteredAthletes.map(({ id, username, email, validated }) => {
                const offline = isOffline(id);
                const pos = positions.get(id);
                const isWsLive = wsPositions.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => setHistoryAthleteId(id)}
                    className="w-full text-left rounded-xl p-2.5 border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                        offline ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {initials(username)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${offline ? 'bg-red-400' : 'bg-green-500 animate-pulse'}`} />
                          <span className="text-sm font-medium text-gray-800 truncate">{username}</span>
                          {!validated && (
                            <span className="shrink-0 text-xs bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded border border-orange-200">!</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate ml-3">{email}</p>
                        {pos ? (
                          <p className="text-xs font-mono text-gray-400 ml-3 mt-0.5">
                            {pos.latitude.toFixed(4)}, {pos.longitude.toFixed(4)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-300 ml-3 mt-0.5">Pas de position</p>
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

          {/* Footer */}
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

export default function AdminCartePageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-white text-gray-400">
        Chargement…
      </div>
    }>
      <AdminCartePage />
    </Suspense>
  );
}
