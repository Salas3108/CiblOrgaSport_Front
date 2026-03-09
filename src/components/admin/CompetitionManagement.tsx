'use client';
import React, { useState, useEffect } from 'react';
import {
  getCompetitions,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  getEvents,
} from '@/src/api/eventsService';

// ── Constants ─────────────────────────────────────────────────────────────────
const DISCIPLINES = [
  { value: 'NATATION', label: 'Natation', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  { value: 'WATER_POLO', label: 'Water Polo', color: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500' },
  { value: 'NATATION_ARTISTIQUE', label: 'Natation artistique', color: 'bg-pink-100 text-pink-700', dot: 'bg-pink-500' },
  { value: 'PLONGEON', label: 'Plongeon', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  { value: 'EAU_LIBRE', label: 'Eau libre', color: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500' },
] as const;

type DisciplineValue = typeof DISCIPLINES[number]['value'];

interface EventItem {
  id: number;
  name: string;
  dateDebut?: string;
  dateFin?: string;
}

interface Competition {
  id: number;
  discipline: DisciplineValue;
  event?: { id: number };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white transition-colors';

function getDisciplineMeta(value: string) {
  return DISCIPLINES.find((d) => d.value === value) ?? {
    value,
    label: value.replace(/_/g, ' '),
    color: 'bg-gray-100 text-gray-700',
    dot: 'bg-gray-400',
  };
}

function DisciplineBadge({ discipline }: { discipline: string }) {
  const meta = getDisciplineMeta(discipline);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

// ── Component ────────────────────────────────────────────────────────────────
export default function CompetitionManagement() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<Competition | null>(null);
  const [form, setForm] = useState({ discipline: '', eventId: '' });
  const [search, setSearch] = useState('');
  const [filterEvent, setFilterEvent] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [compsData, eventsData] = await Promise.all([
        getCompetitions().catch(() => []),
        getEvents().catch(() => []),
      ]);
      setCompetitions(Array.isArray(compsData) ? compsData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.discipline || !form.eventId) {
      setError('Discipline et événement sont obligatoires');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createCompetition({
        discipline: form.discipline,
        event: { id: parseInt(form.eventId) },
      });
      setForm({ discipline: '', eventId: '' });
      showSuccess('Compétition créée');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateCompetition(editing.id, {
        discipline: editing.discipline,
        event: { id: editing.event?.id },
      });
      setEditing(null);
      showSuccess('Compétition mise à jour');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette compétition ?')) return;
    setError(null);
    try {
      await deleteCompetition(id);
      showSuccess('Compétition supprimée');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
    }
  };

  const getEventName = (comp: Competition) => {
    const ev = events.find((e) => e.id === comp.event?.id);
    return ev?.name ?? `Événement #${comp.event?.id ?? '?'}`;
  };

  // Filtered list
  const filtered = competitions.filter((c) => {
    const disc = getDisciplineMeta(c.discipline).label.toLowerCase();
    const evName = getEventName(c).toLowerCase();
    const matchesSearch = !search || disc.includes(search.toLowerCase()) || evName.includes(search.toLowerCase());
    const matchesEvent = !filterEvent || String(c.event?.id) === filterEvent;
    return matchesSearch && matchesEvent;
  });

  // Stats by discipline
  const disciplineStats = DISCIPLINES.map((d) => ({
    ...d,
    count: competitions.filter((c) => c.discipline === d.value).length,
  }));

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 pb-5 border-b border-gray-200">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Compétitions</h2>
          <p className="text-sm text-gray-500">{competitions.length} compétition{competitions.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* ── Discipline stats strip ── */}
      {!loading && competitions.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {disciplineStats.map((d) => (
            <button
              key={d.value}
              onClick={() => setSearch(search === d.label.toLowerCase() ? '' : d.label.toLowerCase())}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all text-sm ${
                search === d.label.toLowerCase()
                  ? `${d.color} border-current`
                  : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${d.dot}`} />
              <span className="font-medium truncate">{d.label}</span>
              <span className="ml-auto font-bold text-xs opacity-70">{d.count}</span>
            </button>
          ))}
        </div>
      )}

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
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
              <h3 className="text-base font-semibold text-white">Nouvelle compétition</h3>
              <p className="text-emerald-200 text-xs mt-0.5">Associez une discipline à un événement</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {/* Discipline picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Discipline *</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {DISCIPLINES.map((d) => (
                    <label key={d.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="discipline"
                        value={d.value}
                        checked={form.discipline === d.value}
                        onChange={() => setForm({ ...form, discipline: d.value })}
                        className="sr-only"
                        required
                      />
                      <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border-2 transition-all text-sm font-medium ${
                        form.discipline === d.value
                          ? `${d.color} border-current`
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${d.dot}`} />
                        {d.label}
                        {form.discipline === d.value && (
                          <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Event selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Événement *</label>
                <select
                  value={form.eventId}
                  onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                  className={inputCls}
                  required
                >
                  <option value="">— Choisir un événement —</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
                {events.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">⚠ Aucun événement disponible — créez-en un d&apos;abord.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !form.discipline || !form.eventId}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
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
                    Créer la compétition
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── List ── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-40 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className="py-2 px-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="">Tous les événements</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
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
                <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Chargement…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {search || filterEvent ? 'Aucune compétition trouvée' : 'Aucune compétition enregistrée'}
                </p>
                {(search || filterEvent) && (
                  <button onClick={() => { setSearch(''); setFilterEvent(''); }}
                    className="text-sm text-emerald-600 hover:underline">
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map((comp) =>
                  editing?.id === comp.id ? (
                    /* ── Edit row ── */
                    <form key={comp.id} onSubmit={handleUpdate} className="p-5 bg-emerald-50/50 space-y-3">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Modification #{comp.id}</p>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Discipline</label>
                        <select
                          value={editing.discipline}
                          onChange={(e) => setEditing({ ...editing, discipline: e.target.value as DisciplineValue })}
                          className={inputCls}
                          required
                        >
                          {DISCIPLINES.map((d) => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Événement</label>
                        <select
                          value={editing.event?.id ?? ''}
                          onChange={(e) => setEditing({ ...editing, event: { id: parseInt(e.target.value) } })}
                          className={inputCls}
                          required
                        >
                          {events.map((ev) => (
                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={submitting}
                          className="flex-1 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl">
                          {submitting ? 'Sauvegarde…' : 'Sauvegarder'}
                        </button>
                        <button type="button" onClick={() => setEditing(null)}
                          className="flex-1 py-2 text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200">
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ── Display row ── */
                    <div key={comp.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                      <DisciplineBadge discipline={comp.discipline} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-500 truncate">{getEventName(comp)}</p>
                      </div>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">#{comp.id}</span>
                      <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditing(comp)}
                          className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(comp.id)}
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
