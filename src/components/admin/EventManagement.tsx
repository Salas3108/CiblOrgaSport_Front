'use client';
import React, { useState, useEffect } from 'react';
import {
  adminGetEvents,
  adminCreateEvent,
  adminDeleteEvent,
  updateEvent,
  getCompetitions,
} from '@/src/api/eventsService';

interface Event {
  id: number;
  name: string;
  dateDebut: string;
  dateFin: string;
  description?: string;
  paysHote?: string;
}

interface Competition {
  id: number;
  discipline: string;
  event?: { id: number };
}

const emptyForm = {
  name: '',
  dateDebut: '',
  dateFin: '',
  description: '',
  paysHote: '',
};

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const formatDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const DISCIPLINE_COLORS: Record<string, string> = {
  NATATION: 'bg-blue-100 text-blue-700',
  WATER_POLO: 'bg-cyan-100 text-cyan-700',
  NATATION_ARTISTIQUE: 'bg-pink-100 text-pink-700',
  PLONGEON: 'bg-violet-100 text-violet-700',
  EAU_LIBRE: 'bg-teal-100 text-teal-700',
};

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsData, compsData] = await Promise.all([
        adminGetEvents().catch(() => []),
        getCompetitions().catch(() => []),
      ]);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setCompetitions(Array.isArray(compsData) ? compsData : []);
    } catch {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.name.trim()) { setError('Le nom est obligatoire'); return; }
    if (eventForm.dateDebut && eventForm.dateFin && eventForm.dateDebut > eventForm.dateFin) {
      setError('La date de fin doit être postérieure à la date de début');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await adminCreateEvent({
        name: eventForm.name,
        dateDebut: eventForm.dateDebut || undefined,
        dateFin: eventForm.dateFin || undefined,
        description: eventForm.description || undefined,
        paysHote: eventForm.paysHote || undefined,
      });
      setEventForm(emptyForm);
      showSuccess('Événement créé avec succès');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    if (editingEvent.dateDebut && editingEvent.dateFin && editingEvent.dateDebut > editingEvent.dateFin) {
      setError('La date de fin doit être postérieure à la date de début');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateEvent(editingEvent.id, {
        name: editingEvent.name,
        dateDebut: editingEvent.dateDebut,
        dateFin: editingEvent.dateFin,
        description: editingEvent.description,
        paysHote: editingEvent.paysHote,
      });
      setEditingEvent(null);
      showSuccess('Événement mis à jour');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Supprimer cet événement et toutes ses données associées ?')) return;
    setError(null);
    try {
      await adminDeleteEvent(id);
      showSuccess('Événement supprimé');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  const getEventCompetitions = (eventId: number) =>
    competitions.filter((c) => c.event?.id === eventId);

  const filtered = events.filter(
    (ev) =>
      ev.name.toLowerCase().includes(search.toLowerCase()) ||
      (ev.paysHote ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 pb-5 border-b border-gray-200">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Événements</h2>
          <p className="text-sm text-gray-500">{events.length} événement{events.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
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
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
              <h3 className="text-base font-semibold text-white">Nouvel événement</h3>
              <p className="text-indigo-200 text-xs mt-0.5">Remplissez les informations ci-dessous</p>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <Field label="Nom de l'événement *">
                <input
                  type="text"
                  placeholder="Ex: Championnats d'Europe 2026"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  className={inputCls}
                  required
                />
              </Field>
              <Field label="Pays hôte">
                <input
                  type="text"
                  placeholder="France"
                  value={eventForm.paysHote}
                  onChange={(e) => setEventForm({ ...eventForm, paysHote: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date début">
                  <input
                    type="date"
                    value={eventForm.dateDebut}
                    onChange={(e) => setEventForm({ ...eventForm, dateDebut: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Date fin">
                  <input
                    type="date"
                    value={eventForm.dateFin}
                    onChange={(e) => setEventForm({ ...eventForm, dateFin: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  placeholder="Description de l'événement…"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows={3}
                  className={inputCls}
                />
              </Field>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
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
                    Créer l&apos;événement
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Event list ── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher un événement…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={loadData}
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
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Chargement…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {search ? 'Aucun résultat' : 'Aucun événement enregistré'}
                </p>
                {!search && <p className="text-xs text-gray-400">Utilisez le formulaire pour créer votre premier événement.</p>}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map((event) => {
                  const eventComps = getEventCompetitions(event.id);
                  return editingEvent?.id === event.id ? (
                    /* ── Edit form ── */
                    <form key={event.id} onSubmit={handleUpdateEvent} className="p-5 bg-indigo-50/50 space-y-3">
                      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Modification</p>
                      <input className={inputCls} value={editingEvent.name}
                        onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                        placeholder="Nom *" required />
                      <input className={inputCls} value={editingEvent.paysHote ?? ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, paysHote: e.target.value })}
                        placeholder="Pays hôte" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="date" className={inputCls} value={editingEvent.dateDebut}
                          onChange={(e) => setEditingEvent({ ...editingEvent, dateDebut: e.target.value })} />
                        <input type="date" className={inputCls} value={editingEvent.dateFin}
                          onChange={(e) => setEditingEvent({ ...editingEvent, dateFin: e.target.value })} />
                      </div>
                      <textarea rows={2} className={inputCls} value={editingEvent.description ?? ''}
                        onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                        placeholder="Description" />
                      <div className="flex gap-2">
                        <button type="submit" disabled={submitting}
                          className="flex-1 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl">
                          {submitting ? 'Sauvegarde…' : 'Sauvegarder'}
                        </button>
                        <button type="button" onClick={() => setEditingEvent(null)}
                          className="flex-1 py-2 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200">
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ── Display card ── */
                    <div key={event.id} className="p-5 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="shrink-0 w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mt-0.5">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900">{event.name}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{event.id}</span>
                            {event.paysHote && (
                              <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                                {event.paysHote}
                              </span>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {(event.dateDebut || event.dateFin) && (
                              <span className="flex items-center gap-1.5 text-xs text-gray-600">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(event.dateDebut)} — {formatDate(event.dateFin)}
                              </span>
                            )}
                            {/* Disciplines badges */}
                            {eventComps.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {eventComps.slice(0, 4).map((c) => (
                                  <span
                                    key={c.id}
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${DISCIPLINE_COLORS[c.discipline] ?? 'bg-gray-100 text-gray-600'}`}
                                  >
                                    {c.discipline.replace('_', ' ')}
                                  </span>
                                ))}
                                {eventComps.length > 4 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                    +{eventComps.length - 4}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingEvent(event)}
                            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
