// src/components/fanzone/FanZoneTable.tsx
// Tableau listant toutes les fan zones pour la page Admin.
// Actions : voir sur la carte, supprimer (avec confirmation).

'use client';

import { useState } from 'react';
import type { FanZoneResponse, TypeService } from '@/types/geo';

const SERVICE_ICONS: Record<TypeService, string> = {
  ECRAN_GEANT: '📺',
  RESTAURATION: '🍽️',
  BOUTIQUE: '🛍️',
  MEDICAL: '🏥',
};

interface FanZoneTableProps {
  fanZones: FanZoneResponse[];
  onDelete: (id: number) => Promise<void>;
  onViewOnMap: (fanZone: FanZoneResponse) => void;
  isDeleting?: number | null;
}

export default function FanZoneTable({
  fanZones,
  onDelete,
  onViewOnMap,
  isDeleting,
}: FanZoneTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    await onDelete(id);
    setConfirmDeleteId(null);
  }

  if (fanZones.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-4xl mb-2">🏟️</p>
        <p>Aucune fan zone enregistrée.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Nom</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Adresse</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Capacité</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Services</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">Coordonnées</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fanZones.map((fz) => (
              <tr
                key={fz.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900">{fz.nom}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                  {fz.adresse ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {fz.capaciteMax !== null
                    ? fz.capaciteMax.toLocaleString('fr-FR')
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {fz.services.length > 0
                      ? fz.services.map((s) => (
                          <span key={s} title={s} className="text-base">
                            {SERVICE_ICONS[s]}
                          </span>
                        ))
                      : <span className="text-gray-400">—</span>
                    }
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs font-mono">
                  {fz.latitude.toFixed(5)}, {fz.longitude.toFixed(5)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onViewOnMap(fz)}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      🗺️ Carte
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(fz.id)}
                      disabled={isDeleting === fz.id}
                      className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                    >
                      {isDeleting === fz.id ? '…' : '🗑️ Supprimer'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmation de suppression */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              Voulez-vous vraiment supprimer la fan zone{' '}
              <strong>
                {fanZones.find((f) => f.id === confirmDeleteId)?.nom}
              </strong>{' '}
              ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isDeleting === confirmDeleteId}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting === confirmDeleteId ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
