// src/components/map/FanZoneMarker.tsx
// Marqueur Leaflet pour une fan zone : icône bleue, popup avec infos complètes.

'use client';

import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { formatDistance } from '@/hooks/useNearbyFanZones';
import type { FanZoneResponse, TypeService } from '@/types/geo';

const SERVICE_ICONS: Record<TypeService, string> = {
  ECRAN_GEANT: '📺',
  RESTAURATION: '🍽️',
  BOUTIQUE: '🛍️',
  MEDICAL: '🏥',
};

const SERVICE_LABELS: Record<TypeService, string> = {
  ECRAN_GEANT: 'Écran géant',
  RESTAURATION: 'Restauration',
  BOUTIQUE: 'Boutique',
  MEDICAL: 'Service médical',
};

/** Icône bleue pour les fan zones */
function createFanZoneIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 32px; height: 32px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 16px;
      ">🏟️</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

interface FanZoneMarkerProps {
  fanZone: FanZoneResponse;
  userLat?: number;
  userLng?: number;
  highlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function FanZoneMarker({
  fanZone,
  userLat,
  userLng,
  onMouseEnter,
  onMouseLeave,
}: FanZoneMarkerProps) {
  const icon = useMemo(() => createFanZoneIcon(), []);

  // Distance calculée côté client si userLat/userLng fournis
  let displayedDistance: string | null = null;
  if (fanZone.distance !== null) {
    displayedDistance = formatDistance(fanZone.distance);
  }

  const googleMapsUrl = `https://maps.google.com/?daddr=${fanZone.latitude},${fanZone.longitude}`;

  return (
    <Marker
      position={[fanZone.latitude, fanZone.longitude]}
      icon={icon}
      eventHandlers={{
        mouseover: onMouseEnter,
        mouseout: onMouseLeave,
      }}
    >
      <Popup maxWidth={280}>
        <div className="text-sm">
          <h3 className="font-bold text-base mb-1">{fanZone.nom}</h3>
          {fanZone.adresse && (
            <p className="text-gray-600 mb-1">📍 {fanZone.adresse}</p>
          )}
          {fanZone.description && (
            <p className="text-gray-700 mb-2">{fanZone.description}</p>
          )}
          {fanZone.capaciteMax !== null && (
            <p className="text-gray-600 mb-1">
              👥 Capacité : {fanZone.capaciteMax.toLocaleString('fr-FR')} personnes
            </p>
          )}
          {displayedDistance && (
            <p className="text-blue-600 font-semibold mb-2">
              📏 {displayedDistance}
            </p>
          )}
          {fanZone.services.length > 0 && (
            <div className="mb-3">
              <p className="font-semibold text-xs uppercase tracking-wide text-gray-500 mb-1">
                Services
              </p>
              <div className="flex flex-wrap gap-1">
                {fanZone.services.map((s) => (
                  <span
                    key={s}
                    title={SERVICE_LABELS[s]}
                    className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
                  >
                    {SERVICE_ICONS[s]} {SERVICE_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>
          )}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center bg-blue-600 text-white rounded px-3 py-1.5 text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            🗺️ M'y rendre
          </a>
        </div>
      </Popup>
    </Marker>
  );
}
