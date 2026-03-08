// src/hooks/useUserGeolocation.ts
// Hook qui expose la position GPS du navigateur de l'utilisateur.
// Fallback sur Paris si la géolocalisation est refusée ou indisponible.

'use client';

import { useEffect, useState } from 'react';

export const PARIS_CENTER = { lat: 48.8566, lng: 2.3522 };

interface UserGeolocationResult {
  lat: number;
  lng: number;
  /** true si la position vient du navigateur, false si c'est le fallback Paris */
  isRealPosition: boolean;
  /** Message d'erreur si la géolocalisation a échoué */
  geoError: string | null;
}

export function useUserGeolocation(): UserGeolocationResult {
  const [lat, setLat] = useState(PARIS_CENTER.lat);
  const [lng, setLng] = useState(PARIS_CENTER.lng);
  const [isRealPosition, setIsRealPosition] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setIsRealPosition(true);
        setGeoError(null);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            'Géolocalisation refusée. La carte est centrée sur Paris par défaut.'
          );
        } else {
          setGeoError("Impossible d'obtenir votre position GPS.");
        }
        setIsRealPosition(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { lat, lng, isRealPosition, geoError };
}
