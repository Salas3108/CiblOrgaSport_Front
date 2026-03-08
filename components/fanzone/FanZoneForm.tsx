// src/components/fanzone/FanZoneForm.tsx
// Formulaire de création de fan zone (modal, utilisé par la page Admin).

'use client';

import { useState } from 'react';
import type { CreateFanZoneRequest, TypeService } from '@/types/geo';

const ALL_SERVICES: { value: TypeService; label: string; icon: string }[] = [
  { value: 'ECRAN_GEANT', label: 'Écran géant', icon: '📺' },
  { value: 'RESTAURATION', label: 'Restauration', icon: '🍽️' },
  { value: 'BOUTIQUE', label: 'Boutique', icon: '🛍️' },
  { value: 'MEDICAL', label: 'Service médical', icon: '🏥' },
];

interface FanZoneFormProps {
  onSubmit: (data: CreateFanZoneRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function FanZoneForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: FanZoneFormProps) {
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [capaciteMax, setCapaciteMax] = useState('');
  const [services, setServices] = useState<TypeService[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!nom.trim()) newErrors.nom = 'Le nom est obligatoire.';
    if (!latitude || isNaN(Number(latitude)) || Math.abs(Number(latitude)) > 90)
      newErrors.latitude = 'Latitude invalide (entre -90 et 90).';
    if (!longitude || isNaN(Number(longitude)) || Math.abs(Number(longitude)) > 180)
      newErrors.longitude = 'Longitude invalide (entre -180 et 180).';
    if (capaciteMax && (isNaN(Number(capaciteMax)) || Number(capaciteMax) <= 0))
      newErrors.capaciteMax = 'Capacité invalide.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function toggleService(s: TypeService) {
    setServices((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const payload: CreateFanZoneRequest = {
      nom: nom.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      ...(description.trim() && { description: description.trim() }),
      ...(adresse.trim() && { adresse: adresse.trim() }),
      ...(capaciteMax && { capaciteMax: Number(capaciteMax) }),
      ...(services.length > 0 && { services }),
    };
    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nom */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Fan Zone Piscine Olympique"
        />
        {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Description optionnelle…"
        />
      </div>

      {/* Adresse */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
        <input
          type="text"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="1 avenue des Champs-Élysées, Paris"
        />
      </div>

      {/* Lat / Lng */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Latitude <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="48.8566"
          />
          {errors.latitude && (
            <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Longitude <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="2.3522"
          />
          {errors.longitude && (
            <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>
          )}
        </div>
      </div>

      {/* Capacité */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Capacité maximale</label>
        <input
          type="number"
          min="1"
          value={capaciteMax}
          onChange={(e) => setCapaciteMax(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="5000"
        />
        {errors.capaciteMax && (
          <p className="text-red-500 text-xs mt-1">{errors.capaciteMax}</p>
        )}
      </div>

      {/* Services */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Services disponibles</label>
        <div className="grid grid-cols-2 gap-2">
          {ALL_SERVICES.map(({ value, label, icon }) => (
            <label
              key={value}
              className={`
                flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors
                ${services.includes(value)
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 hover:border-blue-300'
                }
              `}
            >
              <input
                type="checkbox"
                checked={services.includes(value)}
                onChange={() => toggleService(value)}
                className="sr-only"
              />
              <span className="text-base">{icon}</span>
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Création…' : 'Créer la fan zone'}
        </button>
      </div>
    </form>
  );
}
