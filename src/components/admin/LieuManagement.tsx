'use client';
import React, { useState, useEffect } from 'react';
import eventsService from '@/src/api/eventsService';

interface Lieu {
  id: number;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;
  pays: string;
}

export default function LieuManagement() {
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [editingLieu, setEditingLieu] = useState<Lieu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form
  const [lieuForm, setLieuForm] = useState({
    nom: '',
    adresse: '',
    ville: '',
    codePostal: '',
    pays: ''
  });

  useEffect(() => {
    loadLieux();
  }, []);

  const loadLieux = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventsService.getLieux();
      setLieux(data);
    } catch (error) {
      console.error('Failed to load lieux:', error);
      setError('Erreur lors du chargement des lieux');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLieu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await eventsService.createLieu(lieuForm);
      setLieuForm({ nom: '', adresse: '', ville: '', codePostal: '', pays: '' });
      loadLieux();
    } catch (error) {
      console.error('Failed to create lieu:', error);
      setError('Erreur lors de la création du lieu');
    }
  };

  const handleUpdateLieu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLieu) return;
    
    try {
      await eventsService.updateLieu(editingLieu.id, {
        nom: editingLieu.nom,
        adresse: editingLieu.adresse,
        ville: editingLieu.ville,
        codePostal: editingLieu.codePostal,
        pays: editingLieu.pays
      });
      setEditingLieu(null);
      loadLieux();
    } catch (error) {
      console.error('Failed to update lieu:', error);
      setError('Erreur lors de la modification du lieu');
    }
  };

  const handleDeleteLieu = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lieu ?')) return;
    try {
      await eventsService.deleteLieu(id);
      loadLieux();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Chargement des lieux...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Lieux</h1>
        <p className="mt-2 text-gray-600">Gérez les lieux pour vos événements et épreuves</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Lieu Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Nouveau Lieu</h3>
                <p className="text-sm text-gray-500">Créez un nouveau lieu</p>
              </div>
            </div>

            <form onSubmit={handleCreateLieu} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du lieu
                </label>
                <input
                  type="text"
                  placeholder="Ex: Stade de France"
                  value={lieuForm.nom}
                  onChange={(e) => setLieuForm({...lieuForm, nom: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  placeholder="Ex: Avenue du Stade"
                  value={lieuForm.adresse}
                  onChange={(e) => setLieuForm({...lieuForm, adresse: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    placeholder="Paris"
                    value={lieuForm.ville}
                    onChange={(e) => setLieuForm({...lieuForm, ville: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Code Postal
                  </label>
                  <input
                    type="text"
                    placeholder="75001"
                    value={lieuForm.codePostal}
                    onChange={(e) => setLieuForm({...lieuForm, codePostal: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays
                </label>
                <input
                  type="text"
                  placeholder="France"
                  value={lieuForm.pays}
                  onChange={(e) => setLieuForm({...lieuForm, pays: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Créer le lieu
              </button>
            </form>
          </div>
        </div>

        {/* Lieux List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Lieux existants</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {lieux.length} lieu{lieux.length !== 1 ? 'x' : ''} trouvé{lieux.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={loadLieux}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Actualiser
                </button>
              </div>
            </div>

            <div className="p-6">
              {lieux.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun lieu</h4>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Commencez par créer votre premier lieu en utilisant le formulaire à gauche.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lieux.map((lieu) => (
                    <div key={lieu.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      {editingLieu?.id === lieu.id ? (
                        <form onSubmit={handleUpdateLieu} className="p-4 space-y-3 bg-blue-50">
                          <input
                            type="text"
                            value={editingLieu.nom}
                            onChange={(e) => setEditingLieu({...editingLieu, nom: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Nom"
                            required
                          />
                          <input
                            type="text"
                            value={editingLieu.adresse}
                            onChange={(e) => setEditingLieu({...editingLieu, adresse: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Adresse"
                            required
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editingLieu.ville}
                              onChange={(e) => setEditingLieu({...editingLieu, ville: e.target.value})}
                              className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Ville"
                              required
                            />
                            <input
                              type="text"
                              value={editingLieu.codePostal}
                              onChange={(e) => setEditingLieu({...editingLieu, codePostal: e.target.value})}
                              className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="Code Postal"
                              required
                            />
                          </div>
                          <input
                            type="text"
                            value={editingLieu.pays}
                            onChange={(e) => setEditingLieu({...editingLieu, pays: e.target.value})}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Pays"
                            required
                          />
                          <div className="flex gap-2">
                            <button type="submit" className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                              Sauvegarder
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditingLieu(null)}
                              className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Annuler
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900">{lieu.nom}</h4>
                              <p className="text-sm text-gray-600 mt-1">{lieu.adresse}</p>
                              <p className="text-sm text-gray-600">{lieu.codePostal} {lieu.ville}</p>
                              <p className="text-sm text-gray-500 mt-1">{lieu.pays}</p>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              #{lieu.id}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingLieu(lieu)}
                              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteLieu(lieu.id)}
                              className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              🗑️ Supprimer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
