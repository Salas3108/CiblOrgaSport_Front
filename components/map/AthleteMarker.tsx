// src/components/map/AthleteMarker.tsx
// Marqueur Leaflet pour un athlète :
//  - tooltip avec l'athleteId
//  - badge rouge si hors ligne (> 30 s sans mise à jour)
//  - animation de pulsation si actif

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { WebSocketPositionMessage } from '@/types/geo';

const OFFLINE_THRESHOLD_MS = 30_000; // 30 secondes

interface AthleteMarkerProps {
  athleteId: number;
  position: WebSocketPositionMessage | null;
  /** Timestamp de la dernière mise à jour (ms epoch). Null si jamais reçu. */
  lastUpdateMs: number | null;
  onClick?: () => void;
}

/** Crée une icône SVG colorée pour l'athlète */
function createAthleteIcon(isOffline: boolean): L.DivIcon {
  const color = isOffline ? '#ef4444' : '#22c55e'; // rouge ou vert
  const pulseClass = isOffline ? '' : 'athlete-pulse';
  return L.divIcon({
    className: '',
    html: `
      <div class="${pulseClass}" style="
        width: 28px; height: 28px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 2px ${color};
        display: flex; align-items: center; justify-content: center;
        position: relative;
      ">
        ${isOffline ? '<div style="width:8px;height:8px;background:white;border-radius:50%"></div>' : ''}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function AthleteMarker({
  athleteId,
  position,
  lastUpdateMs,
  onClick,
}: AthleteMarkerProps) {
  if (!position) return null;

  const now = Date.now();
  const isOffline =
    lastUpdateMs === null || now - lastUpdateMs > OFFLINE_THRESHOLD_MS;

  const icon = useMemo(
    () => createAthleteIcon(isOffline),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOffline]
  );

  return (
    <Marker
      position={[position.latitude, position.longitude]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Tooltip direction="top" offset={[0, -14]} permanent={false}>
        <span className="font-semibold">Athlète #{athleteId}</span>
        {isOffline && (
          <span className="ml-2 text-red-500 text-xs">⚠ Hors ligne</span>
        )}
      </Tooltip>
    </Marker>
  );
}
