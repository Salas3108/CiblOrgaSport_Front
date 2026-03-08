// src/app/admin/athletes/carte/page.tsx

'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useAthletePositions } from '@/hooks/useAthletePositions';
import { getAthleteLastPosition } from '@/api/geoService';
import PositionHistoryPanel from '@/components/athlete/PositionHistoryPanel';
import type { WebSocketPositionMessage } from '@/types/geo';

const ADMIN_API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

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

  // ── WebSocket live ─────────────────────────────────────────────────────────
  const { positions: wsPositions, isConnected, error: wsError } = useAthletePositions(athleteIds);

  // ── REST initial snapshot ──────────────────────────────────────────────────
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

  // ── Merge (WebSocket > REST) ───────────────────────────────────────────────
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
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm">Chargement des athlètes…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100 overflow-hidden">

      {/* ── Top header bar ────────────────────────────────────────────────── */}
      <header className="shrink-0 bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-base">
            🗺️
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">Géolocalisation athlètes</h1>
            <p className="text-xs text-gray-500">Administration — temps réel</p>
          </div>
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-3 ml-4">
          <div className="flex items-center gap-1.5 bg-gray-800 rounded-full px-3 py-1 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            <span className="text-gray-300">{athletes.length} athlètes</span>
          </div>
          <div className="flex items-center gap-1.5 bg-green-900/40 border border-green-700/40 rounded-full px-3 py-1 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-300">{onlineCount} actifs</span>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-900/30 border border-blue-700/30 rounded-full px-3 py-1 text-xs">
            <span className="text-blue-300">📍 {withPositionCount} localisés</span>
          </div>
        </div>

        {/* WebSocket status */}
        <div className="ml-auto flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-orange-400'}`} />
          <span className="text-xs text-gray-400">
            {isConnected ? 'WebSocket actif' : 'Cache REST'}
          </span>
          {!isConnected && wsError && (
            <span className="text-xs text-orange-400 bg-orange-900/30 px-2 py-0.5 rounded">
              {wsError}
            </span>
          )}
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Map (reduced: not full height, padded) ── */}
        <main className="flex-1 relative p-3">
          <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
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

        {/* ── Side panel ── */}
        <aside className="w-80 shrink-0 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden">

          {/* Panel header */}
          <div className="px-4 py-3 border-b border-gray-700 space-y-2.5">
            {/* Filter tabs */}
            <div className="flex rounded-lg bg-gray-800 p-1 gap-1 text-xs">
              {(['all', 'validated', 'pending'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-1 rounded-md font-medium transition-colors ${
                    filter === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Tous' : f === 'validated' ? 'Validés' : 'En attente'}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Rechercher un athlète…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {loadError && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-xs text-red-300 mb-2">
                {loadError}
              </div>
            )}
            {filteredAthletes.length === 0 ? (
              <p className="text-xs text-gray-600 text-center pt-10">Aucun athlète trouvé</p>
            ) : (
              filteredAthletes.map(({ id, username, email, validated }) => {
                const offline = isOffline(id);
                const pos = positions.get(id);
                const isWsLive = wsPositions.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => setHistoryAthleteId(id)}
                    className="w-full text-left rounded-xl p-2.5 border border-gray-800 hover:border-gray-600 hover:bg-gray-800/50 transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                        offline ? 'bg-gray-700 text-gray-400' : 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                      }`}>
                        {initials(username)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${offline ? 'bg-red-500' : 'bg-green-400 animate-pulse'}`} />
                          <span className="text-sm font-medium text-white truncate">{username}</span>
                          {!validated && (
                            <span className="shrink-0 text-xs bg-orange-900/40 text-orange-400 px-1.5 py-0.5 rounded border border-orange-700/30">
                              !
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate ml-3">{email}</p>
                        {pos ? (
                          <p className="text-xs font-mono text-gray-600 ml-3 mt-0.5">
                            {pos.latitude.toFixed(4)}, {pos.longitude.toFixed(4)}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-700 ml-3 mt-0.5">Pas de position</p>
                        )}
                      </div>

                      <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded font-medium ${
                        offline ? 'text-red-400' :
                        isWsLive ? 'text-green-400' :
                        'text-yellow-500'
                      }`}>
                        {offline ? 'Off' : isWsLive ? 'Live' : 'Cache'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer legend */}
          <div className="px-4 py-2.5 border-t border-gray-800 flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Actif</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Hors ligne</span>
            <span className="text-green-400">Live</span>
            <span className="text-yellow-500">Cache</span>
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
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-400">
        Chargement…
      </div>
    }>
      <AdminCartePage />
    </Suspense>
  );
}
