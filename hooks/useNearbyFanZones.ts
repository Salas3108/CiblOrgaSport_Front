// src/hooks/useNearbyFanZones.ts
// Hook qui détecte si l'utilisateur est à moins de 300 m d'une fan zone
// et expose une file de notifications toast à afficher.

'use client';

import { useEffect, useRef, useState } from 'react';
import type { FanZoneResponse } from '@/types/geo';

const PROXIMITY_THRESHOLD_M = 300;

/** Calcule la distance en mètres entre deux points GPS (formule haversine). */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000; // rayon terrestre en mètres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface NearbyToast {
  id: string;
  fanZoneName: string;
  distanceM: number;
}

interface UseNearbyFanZonesResult {
  toasts: NearbyToast[];
  dismissToast: (id: string) => void;
}

export function useNearbyFanZones(
  userLat: number,
  userLng: number,
  fanZones: FanZoneResponse[]
): UseNearbyFanZonesResult {
  const [toasts, setToasts] = useState<NearbyToast[]>([]);
  // Garde en mémoire les IDs déjà notifiés pour ne pas spammer
  const notifiedIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    fanZones.forEach((fz) => {
      const distanceM = haversineMeters(userLat, userLng, fz.latitude, fz.longitude);
      if (distanceM < PROXIMITY_THRESHOLD_M && !notifiedIds.current.has(fz.id)) {
        notifiedIds.current.add(fz.id);
        const toastId = `fz-${fz.id}-${Date.now()}`;
        setToasts((prev) => [
          ...prev,
          { id: toastId, fanZoneName: fz.nom, distanceM: Math.round(distanceM) },
        ]);
        // Auto-dismiss après 5 secondes
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId));
          // Réinitialise après la fermeture pour permettre une re-notification
          // si l'utilisateur revient dans la zone
          notifiedIds.current.delete(fz.id);
        }, 5000);
      }
    });
  }, [userLat, userLng, fanZones]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return { toasts, dismissToast };
}

/** Formate une distance en mètres vers un label lisible */
export function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}
