'use client';
import React, { useState, useEffect } from 'react';
import {
  getEpreuves,
  createEpreuve,
  updateEpreuve,
  deleteEpreuve,
  getCompetitions,
  getLieux,
  addAthletesBulkToEpreuve,
  addEquipesToEpreuve,
} from '@/src/api/eventsService';

// ── Enums ────────────────────────────────────────────────────────────────────
const TYPE_EPREUVE = ['INDIVIDUELLE', 'COLLECTIVE'] as const;
const GENRE_EPREUVE = ['FEMININ', 'MASCULIN', 'MIXTE'] as const;
const NIVEAU_EPREUVE = ['QUALIFICATION', 'QUART_DE_FINALE', 'DEMI_FINALE', 'FINALE'] as const;
const STATUT_EPREUVE = ['PLANIFIE', 'EN_COURS', 'TERMINE', 'REPORTE', 'ANNULE'] as const;

// ── Types ────────────────────────────────────────────────────────────────────
interface Competition { id: number; discipline: string }
interface Lieu { id: number; nom: string; ville: string }
interface Epreuve {
  id: number; nom: string; description?: string;
  dateHeure?: string; dureeMinutes?: number;
  competitionId?: number; lieuId?: number;
  typeEpreuve?: string; genreEpreuve?: string;
  niveauEpreuve?: string; statut?: string;
  athleteIds?: number[]; equipeIds?: number[];
}

// ── Styles ───────────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white transition-colors';
const selectCls = inputCls;

const STATUT_STYLE: Record<string, string> = {
  PLANIFIE:  'bg-amber-100 text-amber-700',
  EN_COURS:  'bg-green-100 text-green-700',
  TERMINE:   'bg-gray-100 text-gray-600',
  REPORTE:   'bg-blue-100 text-blue-700',
  ANNULE:    'bg-red-100 text-red-700',
};
const NIVEAU_STYLE: Record<string, string> = {
  QUALIFICATION:   'bg-slate-100 text-slate-600',
  QUART_DE_FINALE: 'bg-sky-100 text-sky-700',
  DEMI_FINALE:     'bg-violet-100 text-violet-700',
  FINALE:          'bg-rose-100 text-rose-700',
};
const NIVEAU_LABEL: Record<string, string> = {
  QUALIFICATION: 'Qualif.', QUART_DE_FINALE: '1/4 finale',
  DEMI_FINALE: '1/2 finale', FINALE: 'Finale',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Badge({ label, style }: { label: string; style: string }) {
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style}`}>{label}</span>;
}

const defaultForm = {
  nom: '', description: '', dateHeure: '',
  dureeMinutes: '60', competitionId: '', lieuId: '',
  typeEpreuve: 'INDIVIDUELLE', genreEpreuve: 'MIXTE',
  niveauEpreuve: 'QUALIFICATION', statut: 'PLANIFIE',
  participantIds: '',
};

// ── Component ────────────────────────────────────────────────────────────────
export default function EpreuveManagement() {
  const [epreuves, setEpreuves] = useState<Epreuve[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<Epreuve | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [participantPanel, setParticipantPanel] = useState<{ epreuveId: number; type: 'athletes' | 'equipes' } | null>(null);
  const [participantInput, setParticipantInput] = useState('');
  const [participantLoading, setParticipantLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ep, co, li] = await Promise.all([
        getEpreuves().catch(() => []),
        getCompetitions().catch(() => []),
        getLieux().catch(() => []),
      ]);
      setEpreuves(Array.isArray(ep) ? ep : []);
      setCompetitions(Array.isArray(co) ? co : []);
      setLieux(Array.isArray(li) ? li : []);
    } catch {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const buildPayload = (f: typeof form) => {
    const isIndiv = f.typeEpreuve === 'INDIVIDUELLE';
    const ids = f.participantIds.split(',').map((s) => parseInt(s.trim())).filter(Boolean);
    return {
      nom: f.nom,
      description: f.description || undefined,
      dateHeure: f.dateHeure || undefined,
      dureeMinutes: parseInt(f.dureeMinutes),
      competitionId: f.competitionId ? parseInt(f.competitionId) : undefined,
      lieuId: f.lieuId ? parseInt(f.lieuId) : undefined,
      typeEpreuve: f.typeEpreuve,
      genreEpreuve: f.genreEpreuve,
      niveauEpreuve: f.niveauEpreuve,
      statut: f.statut,
      athleteIds: isIndiv ? ids : [],
      equipeIds: isIndiv ? [] : ids,
    };
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const dur = parseInt(form.dureeMinutes);
    if (!form.nom.trim()) { setError('Le nom est obligatoire'); return; }
    if (!dur || dur <= 0) { setError('La durée doit être > 0'); return; }
    setSubmitting(true); setError(null);
    try {
      await createEpreuve(buildPayload(form));
      setForm(defaultForm);
      showSuccess('Épreuve créée');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally { setSubmitting(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true); setError(null);
    try {
      await updateEpreuve(editing.id, {
        nom: editing.nom,
        description: editing.description,
        dateHeure: editing.dateHeure,
        dureeMinutes: editing.dureeMinutes,
        competitionId: editing.competitionId,
        lieuId: editing.lieuId,
        typeEpreuve: editing.typeEpreuve,
        genreEpreuve: editing.genreEpreuve,
        niveauEpreuve: editing.niveauEpreuve,
        statut: editing.statut,
        athleteIds: editing.typeEpreuve === 'INDIVIDUELLE' ? (editing.athleteIds ?? []) : [],
        equipeIds: editing.typeEpreuve === 'COLLECTIVE' ? (editing.equipeIds ?? []) : [],
      });
      setEditing(null);
      showSuccess('Épreuve mise à jour');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette épreuve ?')) return;
    setError(null);
    try {
      await deleteEpreuve(id);
      showSuccess('Épreuve supprimée');
      loadData();
    } catch (err: any) { setError(err.message || 'Erreur'); }
  };

  const handleAddParticipants = async () => {
    if (!participantPanel || !participantInput.trim()) return;
    const ids = participantInput.split(',').map((s) => parseInt(s.trim())).filter(Boolean);
    if (!ids.length) return;
    setParticipantLoading(true);
    try {
      if (participantPanel.type === 'athletes') {
        await addAthletesBulkToEpreuve(participantPanel.epreuveId, ids);
      } else {
        await addEquipesToEpreuve(participantPanel.epreuveId, ids);
      }
      setParticipantPanel(null);
      setParticipantInput('');
      showSuccess('Participants ajoutés');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout');
    } finally { setParticipantLoading(false); }
  };

  const getCompLabel = (id?: number) => {
    if (!id) return '—';
    const c = competitions.find((c) => c.id === id);
    return c ? `${c.discipline.replace(/_/g, ' ')} #${c.id}` : `#${id}`;
  };
  const getLieuLabel = (id?: number) => {
    if (!id) return '—';
    const l = lieux.find((l) => l.id === id);
    return l ? `${l.nom}` : `#${id}`;
  };

  const filtered = epreuves.filter((ep) => {
    const matchSearch = !search || ep.nom.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || ep.statut === filterStatut;
    const matchNiveau = !filterNiveau || ep.niveauEpreuve === filterNiveau;
    return matchSearch && matchStatut && matchNiveau;
  });

  const isFormIndiv = form.typeEpreuve === 'INDIVIDUELLE';

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-4 pb-5 border-b border-gray-200">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Épreuves</h2>
          <p className="text-sm text-gray-500">{epreuves.length} épreuve{epreuves.length > 1 ? 's' : ''}</p>
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

      {/* ── Participant panel ── */}
      {participantPanel && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="shrink-0">
            <p className="text-sm font-semibold text-blue-800">
              Ajouter des {participantPanel.type === 'athletes' ? 'athlètes' : 'équipes'} — épreuve #{participantPanel.epreuveId}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">Saisissez les IDs séparés par des virgules</p>
          </div>
          <input
            type="text"
            value={participantInput}
            onChange={(e) => setParticipantInput(e.target.value)}
            placeholder="1, 2, 3…"
            className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white min-w-0"
          />
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleAddParticipants}
              disabled={participantLoading || !participantInput.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {participantLoading ? 'Ajout…' : 'Ajouter'}
            </button>
            <button
              onClick={() => { setParticipantPanel(null); setParticipantInput(''); }}
              className="px-3 py-2 bg-white border border-blue-200 text-blue-700 text-sm rounded-xl hover:bg-blue-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── Create form ── */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-4">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
              <h3 className="text-base font-semibold text-white">Nouvelle épreuve</h3>
              <p className="text-orange-200 text-xs mt-0.5">Champs marqués <span className="text-orange-300">*</span> obligatoires</p>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <Field label="Nom" required>
                <input type="text" value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  className={inputCls} placeholder="100m dos femmes" required />
              </Field>
              <Field label="Description">
                <textarea rows={2} value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputCls} placeholder="Description de l'épreuve…" />
              </Field>

              {/* Type toggle */}
              <Field label="Type" required>
                <div className="flex rounded-xl overflow-hidden border border-gray-300">
                  {TYPE_EPREUVE.map((t) => (
                    <button key={t} type="button"
                      onClick={() => setForm({ ...form, typeEpreuve: t, participantIds: '' })}
                      className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                        form.typeEpreuve === t
                          ? 'bg-orange-600 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      }`}>
                      {t === 'INDIVIDUELLE' ? '👤 Individuelle' : '👥 Collective'}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Genre" required>
                  <select value={form.genreEpreuve}
                    onChange={(e) => setForm({ ...form, genreEpreuve: e.target.value })}
                    className={selectCls} required>
                    {GENRE_EPREUVE.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Niveau" required>
                  <select value={form.niveauEpreuve}
                    onChange={(e) => setForm({ ...form, niveauEpreuve: e.target.value })}
                    className={selectCls} required>
                    {NIVEAU_EPREUVE.map((n) => (
                      <option key={n} value={n}>{NIVEAU_LABEL[n] ?? n}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Date/heure" required>
                  <input type="datetime-local" value={form.dateHeure}
                    onChange={(e) => setForm({ ...form, dateHeure: e.target.value })}
                    className={inputCls} required />
                </Field>
                <Field label="Durée (min)" required>
                  <input type="number" min="1" value={form.dureeMinutes}
                    onChange={(e) => setForm({ ...form, dureeMinutes: e.target.value })}
                    className={inputCls} required />
                </Field>
              </div>

              <Field label="Compétition">
                <select value={form.competitionId}
                  onChange={(e) => setForm({ ...form, competitionId: e.target.value })}
                  className={selectCls}>
                  <option value="">— Choisir —</option>
                  {competitions.map((c) => (
                    <option key={c.id} value={c.id}>{c.discipline.replace(/_/g, ' ')} #{c.id}</option>
                  ))}
                </select>
              </Field>

              <Field label="Lieu">
                <select value={form.lieuId}
                  onChange={(e) => setForm({ ...form, lieuId: e.target.value })}
                  className={selectCls}>
                  <option value="">— Choisir —</option>
                  {lieux.map((l) => (
                    <option key={l.id} value={l.id}>{l.nom} ({l.ville})</option>
                  ))}
                </select>
              </Field>

              <Field label={`Statut`}>
                <select value={form.statut}
                  onChange={(e) => setForm({ ...form, statut: e.target.value })}
                  className={selectCls}>
                  {STATUT_EPREUVE.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label={isFormIndiv ? 'IDs Athlètes (virgules)' : 'IDs Équipes (virgules)'}>
                <input type="text" value={form.participantIds}
                  onChange={(e) => setForm({ ...form, participantIds: e.target.value })}
                  className={inputCls}
                  placeholder={isFormIndiv ? '1, 2, 3…' : '10, 11…'} />
                <p className="text-xs text-gray-400 mt-1">
                  {isFormIndiv
                    ? 'INDIVIDUELLE → athleteIds uniquement'
                    : 'COLLECTIVE → equipeIds uniquement'}
                </p>
              </Field>

              <button type="submit" disabled={submitting}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2">
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
                    Créer l&apos;épreuve
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── List ── */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-2 items-center">
              <div className="flex-1 min-w-40 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Rechercher une épreuve…" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500" />
              </div>
              <select value={filterNiveau} onChange={(e) => setFilterNiveau(e.target.value)}
                className="py-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500">
                <option value="">Tous niveaux</option>
                {NIVEAU_EPREUVE.map((n) => <option key={n} value={n}>{NIVEAU_LABEL[n]}</option>)}
              </select>
              <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
                className="py-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500">
                <option value="">Tous statuts</option>
                {STATUT_EPREUVE.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={loadData} title="Actualiser"
                className="p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Body */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Chargement…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 font-medium">
                  {search || filterStatut || filterNiveau ? 'Aucune épreuve trouvée' : 'Aucune épreuve enregistrée'}
                </p>
                {(search || filterStatut || filterNiveau) && (
                  <button onClick={() => { setSearch(''); setFilterStatut(''); setFilterNiveau(''); }}
                    className="text-sm text-orange-600 hover:underline">
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[720px] overflow-y-auto">
                {filtered.map((ep) =>
                  editing?.id === ep.id ? (
                    /* ── Edit row ── */
                    <form key={ep.id} onSubmit={handleUpdate} className="p-5 bg-orange-50/40 space-y-3">
                      <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Modification #{ep.id}</p>
                      <input className={inputCls} value={editing.nom}
                        onChange={(e) => setEditing({ ...editing, nom: e.target.value })}
                        placeholder="Nom *" required />
                      <input type="datetime-local" className={inputCls} value={editing.dateHeure?.slice(0, 16) ?? ''}
                        onChange={(e) => setEditing({ ...editing, dateHeure: e.target.value })} required />
                      <div className="grid grid-cols-2 gap-2">
                        <select className={selectCls} value={editing.typeEpreuve ?? ''}
                          onChange={(e) => setEditing({ ...editing, typeEpreuve: e.target.value })}>
                          {TYPE_EPREUVE.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select className={selectCls} value={editing.niveauEpreuve ?? ''}
                          onChange={(e) => setEditing({ ...editing, niveauEpreuve: e.target.value })}>
                          {NIVEAU_EPREUVE.map((n) => <option key={n} value={n}>{NIVEAU_LABEL[n]}</option>)}
                        </select>
                        <select className={selectCls} value={editing.genreEpreuve ?? ''}
                          onChange={(e) => setEditing({ ...editing, genreEpreuve: e.target.value })}>
                          {GENRE_EPREUVE.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select className={selectCls} value={editing.statut ?? ''}
                          onChange={(e) => setEditing({ ...editing, statut: e.target.value })}>
                          {STATUT_EPREUVE.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={submitting}
                          className="flex-1 py-2 text-sm font-semibold bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-xl">
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
                    <div key={ep.id} className="px-5 py-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-start gap-3">
                        {/* Type icon */}
                        <div className={`shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
                          ep.typeEpreuve === 'INDIVIDUELLE' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          {ep.typeEpreuve === 'INDIVIDUELLE' ? '👤' : '👥'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm">{ep.nom}</span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">#{ep.id}</span>
                          </div>

                          {/* Badges row */}
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {ep.statut && (
                              <Badge label={ep.statut} style={STATUT_STYLE[ep.statut] ?? 'bg-gray-100 text-gray-600'} />
                            )}
                            {ep.niveauEpreuve && (
                              <Badge label={NIVEAU_LABEL[ep.niveauEpreuve] ?? ep.niveauEpreuve}
                                style={NIVEAU_STYLE[ep.niveauEpreuve] ?? 'bg-gray-100 text-gray-600'} />
                            )}
                            {ep.genreEpreuve && (
                              <Badge label={ep.genreEpreuve} style="bg-gray-100 text-gray-600" />
                            )}
                          </div>

                          {/* Meta info */}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                            {ep.dateHeure && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(ep.dateHeure).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                                {ep.dureeMinutes && <> — {ep.dureeMinutes} min</>}
                              </span>
                            )}
                            {ep.competitionId && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {getCompLabel(ep.competitionId)}
                              </span>
                            )}
                            {ep.lieuId && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {getLieuLabel(ep.lieuId)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex-col sm:flex-row">
                          {ep.typeEpreuve === 'INDIVIDUELLE' && (
                            <button
                              onClick={() => setParticipantPanel({ epreuveId: ep.id, type: 'athletes' })}
                              className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
                              title="Ajouter des athlètes"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                            </button>
                          )}
                          {ep.typeEpreuve === 'COLLECTIVE' && (
                            <button
                              onClick={() => setParticipantPanel({ epreuveId: ep.id, type: 'equipes' })}
                              className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                              title="Ajouter des équipes"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </button>
                          )}
                          <button onClick={() => setEditing(ep)}
                            className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                            title="Modifier">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(ep.id)}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            title="Supprimer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
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
