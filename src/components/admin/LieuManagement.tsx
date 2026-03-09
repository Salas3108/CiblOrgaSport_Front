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
  capaciteSpectateurs?: number;
}

const emptyForm = {
  nom: '',
  adresse: '',
  ville: '',
  codePostal: '',
  pays: '',
  capaciteSpectateurs: '',
};

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

export default function LieuManagement() {
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [editingLieu, setEditingLieu] = useState<Lieu | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lieuForm, setLieuForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  useEffect(() => { loadLieux(); }, []);

  const loadLieux = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventsService.getLieux();
      setLieux(Array.isArray(data) ? data : []);
    } catch {
      setError('Erreur lors du chargement des lieux');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleCreateLieu = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await eventsService.createLieu({
        nom: lieuForm.nom,
        adresse: lieuForm.adresse,
        ville: lieuForm.ville,
        codePostal: lieuForm.codePostal,
        pays: lieuForm.pays,
        ...(lieuForm.capaciteSpectateurs
          ? { capaciteSpectateurs: parseInt(lieuForm.capaciteSpectateurs) }
          : {}),
      });
      setLieuForm(emptyForm);
      showSuccess('Lieu créé avec succès');
      loadLieux();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du lieu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLieu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLieu) return;
    setSubmitting(true);
    setError(null);
    try {
      await eventsService.updateLieu(editingLieu.id, {
        nom: editingLieu.nom,
        adresse: editingLieu.adresse,
        ville: editingLieu.ville,
        codePostal: editingLieu.codePostal,
        pays: editingLieu.pays,
        capaciteSpectateurs: editingLieu.capaciteSpectateurs,
      });
      setEditingLieu(null);
      showSuccess('Lieu mis à jour');
      loadLieux();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification du lieu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLieu = async (id: number) => {
    if (!confirm('Supprimer ce lieu définitivement ?')) return;
    setError(null);
    try {
      await eventsService.deleteLieu(id);
      showSuccess('Lieu supprimé');
      loadLieux();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  const filtered = lieux.filter(
    (l) =>
      l.nom.toLowerCase().includes(search.toLowerCase()) ||
      l.ville.toLowerCase().includes(search.toLowerCase()) ||
      l.pays.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 pb-5 border-b border-gray-200">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Lieux</h2>
          <p className="text-sm text-gray-500">
            {lieux.length} lieu{lieux.length > 1 ? 'x' : ''} enregistré{lieux.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="font-bold text-red-400 hover:text-red-600">×</button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Create form ── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-4">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="text-base font-semibold text-white">Nouveau lieu</h3>
              <p className="text-blue-200 text-xs mt-0.5">Remplissez les informations ci-dessous</p>
            </div>
            <form onSubmit={handleCreateLieu} className="p-6 space-y-4">
              <Field label="Nom du lieu *">
                <input
                  type="text"
                  placeholder="Ex: Stade Aquatique"
                  value={lieuForm.nom}
                  onChange={(e) => setLieuForm({ ...lieuForm, nom: e.target.value })}
                  className={inputCls}
                  required
                />
              </Field>
              <Field label="Adresse *">
                <input
                  type="text"
                  placeholder="1 rue des Sports"
                  value={lieuForm.adresse}
                  onChange={(e) => setLieuForm({ ...lieuForm, adresse: e.target.value })}
                  className={inputCls}
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ville *">
                  <input
                    type="text"
                    placeholder="Paris"
                    value={lieuForm.ville}
                    onChange={(e) => setLieuForm({ ...lieuForm, ville: e.target.value })}
                    className={inputCls}
                    required
                  />
                </Field>
                <Field label="Code postal *">
                  <input
                    type="text"
                    placeholder="75001"
                    value={lieuForm.codePostal}
                    onChange={(e) => setLieuForm({ ...lieuForm, codePostal: e.target.value })}
                    className={inputCls}
                    required
                  />
                </Field>
              </div>
              <Field label="Pays *">
                <input
                  type="text"
                  placeholder="France"
                  value={lieuForm.pays}
                  onChange={(e) => setLieuForm({ ...lieuForm, pays: e.target.value })}
                  className={inputCls}
                  required
                />
              </Field>
              <Field label="Capacité spectateurs">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="15000"
                    value={lieuForm.capaciteSpectateurs}
                    onChange={(e) => setLieuForm({ ...lieuForm, capaciteSpectateurs: e.target.value })}
                    className={inputCls}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
                    places
                  </span>
                </div>
              </Field>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Création…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Créer le lieu
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── List ── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Search bar */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher par nom, ville ou pays…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={loadLieux}
                title="Actualiser"
                className="p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Chargement…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {search ? 'Aucun résultat pour cette recherche' : 'Aucun lieu enregistré'}
                </p>
                {!search && <p className="text-xs text-gray-400">Utilisez le formulaire pour créer votre premier lieu.</p>}
                {search && (
                  <button onClick={() => setSearch('')} className="text-sm text-blue-600 hover:underline">
                    Effacer la recherche
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map((lieu) =>
                  editingLieu?.id === lieu.id ? (
                    /* ── Edit row ── */
                    <form key={lieu.id} onSubmit={handleUpdateLieu} className="p-5 bg-blue-50/60 space-y-3">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Modification de « {lieu.nom} »</p>
                      <div className="grid grid-cols-2 gap-3">
                        <input className={`${inputCls} col-span-2`} value={editingLieu.nom}
                          onChange={(e) => setEditingLieu({ ...editingLieu, nom: e.target.value })}
                          placeholder="Nom" required />
                        <input className={`${inputCls} col-span-2`} value={editingLieu.adresse}
                          onChange={(e) => setEditingLieu({ ...editingLieu, adresse: e.target.value })}
                          placeholder="Adresse" required />
                        <input className={inputCls} value={editingLieu.ville}
                          onChange={(e) => setEditingLieu({ ...editingLieu, ville: e.target.value })}
                          placeholder="Ville" required />
                        <input className={inputCls} value={editingLieu.codePostal}
                          onChange={(e) => setEditingLieu({ ...editingLieu, codePostal: e.target.value })}
                          placeholder="Code postal" required />
                        <input className={inputCls} value={editingLieu.pays}
                          onChange={(e) => setEditingLieu({ ...editingLieu, pays: e.target.value })}
                          placeholder="Pays" required />
                        <input type="number" min="0" className={inputCls}
                          value={editingLieu.capaciteSpectateurs ?? ''}
                          onChange={(e) =>
                            setEditingLieu({
                              ...editingLieu,
                              capaciteSpectateurs: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          placeholder="Capacité (places)" />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={submitting}
                          className="flex-1 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl">
                          {submitting ? 'Sauvegarde…' : 'Sauvegarder'}
                        </button>
                        <button type="button" onClick={() => setEditingLieu(null)}
                          className="flex-1 py-2 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200">
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ── Display row ── */
                    <div key={lieu.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                      <div className="shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 truncate">{lieu.nom}</span>
                          <span className="shrink-0 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{lieu.id}</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{lieu.adresse}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{lieu.codePostal} {lieu.ville} — {lieu.pays}</span>
                          {lieu.capaciteSpectateurs != null && lieu.capaciteSpectateurs > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {lieu.capaciteSpectateurs.toLocaleString('fr-FR')} places
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingLieu(lieu)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteLieu(lieu.id)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
