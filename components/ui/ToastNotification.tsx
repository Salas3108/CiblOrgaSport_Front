// src/components/ui/ToastNotification.tsx
// Notifications toast en bas à droite pour signaler la proximité d'une fan zone.
// S'auto-détruit après 5 secondes.

'use client';

import { useEffect, useState } from 'react';
import { formatDistance } from '@/hooks/useNearbyFanZones';
import type { NearbyToast } from '@/hooks/useNearbyFanZones';

interface ToastNotificationProps {
  toasts: NearbyToast[];
  onDismiss: (id: string) => void;
}

interface AnimatedToast extends NearbyToast {
  visible: boolean;
}

export default function ToastNotification({ toasts, onDismiss }: ToastNotificationProps) {
  const [animatedToasts, setAnimatedToasts] = useState<AnimatedToast[]>([]);

  useEffect(() => {
    setAnimatedToasts((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newItems = toasts
        .filter((t) => !existingIds.has(t.id))
        .map((t) => ({ ...t, visible: false }));

      if (newItems.length === 0) {
        // Marquer comme invisible ceux qui ont été retirés
        return prev.map((t) => ({
          ...t,
          visible: toasts.some((tt) => tt.id === t.id),
        }));
      }

      const updated = [...prev, ...newItems];
      // Déclencher l'animation d'entrée au prochain tick
      requestAnimationFrame(() => {
        setAnimatedToasts((a) =>
          a.map((t) =>
            newItems.some((n) => n.id === t.id) ? { ...t, visible: true } : t
          )
        );
      });
      return updated;
    });
  }, [toasts]);

  if (animatedToasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
    >
      {animatedToasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto
            flex items-start gap-3 bg-white border border-blue-200
            shadow-xl rounded-2xl px-4 py-3 max-w-xs
            transition-all duration-300 ease-out
            ${toast.visible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
            }
          `}
        >
          <span className="text-2xl shrink-0">🏟️</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-snug">
              Fan zone à proximité !
            </p>
            <p className="text-gray-600 text-xs mt-0.5">
              <strong className="text-blue-700">{toast.fanZoneName}</strong>
              {' '}est à{' '}
              <strong>{formatDistance(toast.distanceM)}</strong>
            </p>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none ml-1 shrink-0 transition-colors"
            aria-label="Fermer la notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
