// src/components/fanzone/FanZoneCard.tsx
// Carte d'une fan zone dans le panneau latéral.
// Affiche : nom, distance, icônes services.
// Se met en surbrillance au hover (synchronisé avec le marqueur sur la carte).

'use client';

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
  MEDICAL: 'Médical',
};

interface FanZoneCardProps {
  fanZone: FanZoneResponse;
  highlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
}

export default function FanZoneCard({
  fanZone,
  highlighted = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: FanZoneCardProps) {
  return (
    <div
      className={`
        rounded-xl border p-4 cursor-pointer transition-all duration-150
        ${highlighted
          ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.01]'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
        }
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{fanZone.nom}</h3>
          {fanZone.adresse && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {fanZone.adresse}</p>
          )}
        </div>
        {fanZone.distance !== null && (
          <span className="shrink-0 text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
            {formatDistance(fanZone.distance)}
          </span>
        )}
      </div>

      {fanZone.services.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {fanZone.services.map((s) => (
            <span
              key={s}
              title={SERVICE_LABELS[s]}
              className="text-base"
              aria-label={SERVICE_LABELS[s]}
            >
              {SERVICE_ICONS[s]}
            </span>
          ))}
        </div>
      )}

      <a
        href={`https://maps.google.com/?daddr=${fanZone.latitude},${fanZone.longitude}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="
          mt-3 w-full block text-center text-xs font-semibold
          bg-blue-600 text-white rounded-lg py-1.5
          hover:bg-blue-700 transition-colors
        "
      >
        🗺️ M'y rendre
      </a>
    </div>
  );
}
