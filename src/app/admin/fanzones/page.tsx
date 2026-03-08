// src/app/admin/fanzones/page.tsx
// Page Admin — Gestion des fan zones.
// Tableau + création (modal) + suppression + recentrage carte.

'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllFanZones, createFanZone, deleteFanZone } from '@/api/geoService';
import FanZoneTable from '@/components/fanzone/FanZoneTable';
import FanZoneForm from '@/components/fanzone/FanZoneForm';
import type { CreateFanZoneRequest, FanZoneResponse } from '@/types/geo';

// Import dynamique Leaflet
const MapComponent = dynamic(() => import('@/components/map/MapComponent'), { ssr: false });
const FanZoneMarker = dynamic(() => import('@/components/map/FanZoneMarker'), { ssr: false });

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];

export default function AdminFanZonesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(PARIS_CENTER);
  const [mapZoom, setMapZoom] = useState(12);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Chargement
  const { data: fanZones = [], isLoading, isError } = useQuery({
    queryKey: ['fanZones'],
    queryFn: getAllFanZones,
  });

  // Création
  const createMutation = useMutation({
    mutationFn: createFanZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fanZones'] });
      setShowForm(false);
      setFormError(null);
    },
    onError: () => {
      setFormError('Erreur lors de la création. Vérifiez les données.');
    },
  });

  // Suppression
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteFanZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fanZones'] });
    },
    onError: () => {
      alert('Impossible de supprimer cette fan zone.');
    },
    onSettled: () => setDeletingId(null),
  });

  async function handleCreate(data: CreateFanZoneRequest) {
    setFormError(null);
    await createMutation.mutateAsync(data);
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    await deleteMutation.mutateAsync(id);
  }

  function handleViewOnMap(fz: FanZoneResponse) {
    setMapCenter([fz.latitude, fz.longitude]);
    setMapZoom(16);
    // Scroll vers la carte sur mobile
    document.getElementById('admin-map')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🏟️ Gestion des Fan Zones</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Administration — Championnats d'Europe de Natation 2026
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setFormError(null); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Ajouter une fan zone
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Carte */}
        <section
          id="admin-map"
          className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
          style={{ height: '360px' }}
        >
          <MapComponent center={mapCenter} zoom={mapZoom} className="h-full">
            {fanZones.map((fz) => (
              <FanZoneMarker key={fz.id} fanZone={fz} />
            ))}
          </MapComponent>
        </section>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Fan zones', value: fanZones.length, icon: '🏟️' },
            {
              label: 'Capacité totale',
              value: fanZones
                .reduce((s, fz) => s + (fz.capaciteMax ?? 0), 0)
                .toLocaleString('fr-FR'),
              icon: '👥',
            },
            {
              label: 'Avec écran',
              value: fanZones.filter((fz) => fz.services.includes('ECRAN_GEANT')).length,
              icon: '📺',
            },
            {
              label: 'Avec médical',
              value: fanZones.filter((fz) => fz.services.includes('MEDICAL')).length,
              icon: '🏥',
            },
          ].map(({ label, value, icon }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3"
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tableau */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Liste des fan zones{' '}
              <span className="text-gray-400 font-normal text-sm">({fanZones.length})</span>
            </h2>
          </div>
          <div className="p-6">
            {isLoading && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {isError && (
              <p className="text-red-500 text-sm text-center py-8">
                Impossible de charger les fan zones. Vérifiez la connexion au backend.
              </p>
            )}
            {!isLoading && !isError && (
              <FanZoneTable
                fanZones={fanZones}
                onDelete={handleDelete}
                onViewOnMap={handleViewOnMap}
                isDeleting={deletingId}
              />
            )}
          </div>
        </section>
      </main>

      {/* ── Modal Création ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle fan zone</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5">
              {formError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  ⚠️ {formError}
                </div>
              )}
              <FanZoneForm
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
                isLoading={createMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
