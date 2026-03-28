'use client';

// Invisible background component.
// If the logged-in user is an athlete, silently watches GPS
// and sends position to the backend every 5 seconds.
// Mount it once at the root layout level — no page required.

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { postAthletePosition } from '@/api/geoService';
import { getUserId } from '@/lib/jwt';

const SEND_INTERVAL_MS = 5000;

const ATHLETE_ROLES = new Set([
  'athlete', 'ATHLETE', 'ROLE_ATHLETE',
]);

export default function AthleteGpsTracker() {
  const { user, isAuthenticated } = useAuth();
  const positionRef = useRef<{ lat: number; lng: number } | null>(null);

  const isAthlete =
    isAuthenticated &&
    user?.role != null &&
    ATHLETE_ROLES.has(String(user.role));

  useEffect(() => {
    if (!isAthlete) return;
    if (typeof window === 'undefined' || !navigator.geolocation) return;

    const userId = getUserId();
    if (!userId) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        positionRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
      },
      () => { /* silent — no UI to update */ },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    const intervalId = setInterval(async () => {
      if (!positionRef.current) return;
      const { lat, lng } = positionRef.current;
      try {
        await postAthletePosition(userId, lat, lng);
      } catch {
        // silent retry on next tick
      }
    }, SEND_INTERVAL_MS);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
    };
  }, [isAthlete]);

  return null;
}
