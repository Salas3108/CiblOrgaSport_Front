// src/app/fanzones/page.tsx
// Page fan zones publique (spectateurs).
// Carte Leaflet + liste triée par distance + recherche + filtres + toasts.

'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllFanZones } from '@/api/geoService';
import { useUserGeolocation } from '@/hooks/useUserGeolocation';
import { useNearbyFanZones, formatDistance } from '@/hooks/useNearbyFanZones';
import FanZoneCard from '@/components/fanzone/FanZoneCard';
import ToastNotification from '@/components/ui/ToastNotification';
import type { TypeService, FanZoneResponse } from '@/types/geo';

// Import dynamique Leaflet (pas SSR) — Leaflet accède à window au chargement
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), { ssr: false });
const FanZoneMarker = dynamic(() => import('@/components/map/FanZoneMarker'), { ssr: false });
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('react-leaflet').then((m) => m.Tooltip),
  { ssr: false }
);

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

const ALL_SERVICES: { value: TypeService; label: string; icon: string }[] = [
  { value: 'ECRAN_GEANT', label: 'Écran géant', icon: '📺' },
  { value: 'RESTAURATION', label: 'Restauration', icon: '🍽️' },
  { value: 'BOUTIQUE', label: 'Boutique', icon: '🛍️' },
  { value: 'MEDICAL', label: 'Médical', icon: '🏥' },
];

/** Crée l'icône violette pour la position utilisateur (client-only, via import dynamique) */
async function createUserIcon() {
  const L = (await import('leaflet')).default;
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 20px; height: 20px;
        background: #8b5cf6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 3px #8b5cf6;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

/** Distance haversine en mètres */
function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function FanZonesPage() {
  const { lat, lng, isRealPosition, geoError } = useUserGeolocation();
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [serviceFilters, setServiceFilters] = useState<TypeService[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userIcon, setUserIcon] = useState<any>(null);

  // Créer l'icône côté client uniquement (Leaflet accède à window)
  useEffect(() => {
    createUserIcon().then(setUserIcon);
  }, []);

  // Chargement des fan zones (public, sans token)
  const { data: rawFanZones = [], isLoading, isError } = useQuery({
    queryKey: ['fanZones'],
    queryFn: getAllFanZones,
    staleTime: 60_000,
  });

  // Injecter la distance calculée côté client
  const fanZones: FanZoneResponse[] = useMemo(
    () =>
      rawFanZones.map((fz) => ({
        ...fz,
        distance: Math.round(haversineM(lat, lng, fz.latitude, fz.longitude)),
      })),
    [rawFanZones, lat, lng]
  );

  // Filtrage + tri
  const filteredFanZones = useMemo(() => {
    let result = fanZones;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((fz) => fz.nom.toLowerCase().includes(q));
    }
    if (serviceFilters.length > 0) {
      result = result.filter((fz) =>
        serviceFilters.every((s) => fz.services.includes(s))
      );
    }
    return [...result].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [fanZones, search, serviceFilters]);

  const { toasts, dismissToast } = useNearbyFanZones(lat, lng, fanZones);

  function toggleServiceFilter(s: TypeService) {
    setServiceFilters((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const mapCenter: [number, number] = isRealPosition ? [lat, lng] : PARIS_CENTER;

  return (
    <div className="flex bg-gray-50 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* ── Panneau gauche ── */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Titre */}
        <div className="px-5 py-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">🏟️ Fan Zones</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Championnats d'Europe de Natation 2026
          </p>
        </div>

        {/* Géolocalisation */}
        {geoError && (
          <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800">
            ⚠️ {geoError}
          </div>
        )}

        {/* Recherche */}
        <div className="px-4 pt-4 pb-2">
          <input
            type="search"
            placeholder="Rechercher une fan zone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filtres services */}
        <div className="px-4 pb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Filtrer par service
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SERVICES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => toggleServiceFilter(value)}
                className={`
                  flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                  ${serviceFilters.includes(value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste fan zones */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {isError && (
            <p className="text-red-500 text-sm text-center py-4">
              Impossible de charger les fan zones.
            </p>
          )}

          {!isLoading && !isError && filteredFanZones.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">
              Aucune fan zone dans ce rayon,{' '}
              essayez d'augmenter le rayon ou de modifier les filtres.
            </p>
          )}

          {filteredFanZones.map((fz) => (
            <FanZoneCard
              key={fz.id}
              fanZone={fz}
              highlighted={highlightedId === fz.id}
              onMouseEnter={() => setHighlightedId(fz.id)}
              onMouseLeave={() => setHighlightedId(null)}
            />
          ))}
        </div>
      </aside>

      {/* ── Carte ── */}
      <main className="flex-1 relative">
        <MapComponent center={mapCenter} zoom={13} className="h-full">
          {/* Marqueur position utilisateur */}
          {isRealPosition && userIcon && (
            <Marker position={[lat, lng]} icon={userIcon}>
              <Tooltip direction="top" offset={[0, -12]} permanent={false}>
                Ma position
              </Tooltip>
            </Marker>
          )}

          {/* Marqueurs fan zones */}
          {filteredFanZones.map((fz) => (
            <FanZoneMarker
              key={fz.id}
              fanZone={fz}
              highlighted={highlightedId === fz.id}
              onMouseEnter={() => setHighlightedId(fz.id)}
              onMouseLeave={() => setHighlightedId(null)}
            />
          ))}
        </MapComponent>
      </main>

      {/* ── Toasts proximité ── */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
