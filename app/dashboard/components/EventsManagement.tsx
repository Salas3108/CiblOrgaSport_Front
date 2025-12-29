'use client';

import React, { useEffect, useState } from 'react';
import axiosInstance from '@/lib/api/axios';
import { jwtDecode } from 'jwt-decode';

type Epreuve = { id: string; name: string; competitionId: string };
type Competition = { id: string; name: string; eventId: string; epreuves?: Epreuve[]; eventName?: string };
type Event = { id: string; name: string; competitions?: Competition[] };

type Props = { user?: any };

export default function EventsManagement({ user }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventName, setNewEventName] = useState('');
  const [newCompetitionName, setNewCompetitionName] = useState('');
  const [selectedEventForCompetition, setSelectedEventForCompetition] = useState<string>('');
  const [newEpreuveName, setNewEpreuveName] = useState('');
  const [selectedCompetitionForEpreuve, setSelectedCompetitionForEpreuve] = useState<string>('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreatingCompetition, setIsCreatingCompetition] = useState(false);
  const [isCreatingEpreuve, setIsCreatingEpreuve] = useState(false);
  const [message, setMessage] = useState('');

  const checkAdminPermissions = (): boolean => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const decoded: any = jwtDecode(token);
      const roles = decoded?.roles || decoded?.authorities || decoded?.role || decoded?.scope;
      if (!roles) return false;
      if (Array.isArray(roles)) {
        return roles.some((role: string) => role.includes('ADMIN') || role.includes('ROLE_ADMIN') || role === 'admin');
      }
      const rolesString = String(roles).toUpperCase();
      return rolesString.includes('ADMIN') || rolesString.includes('ROLE_ADMIN');
    } catch (e) {
      return false;
    }
  };

  const fetchEvents = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axiosInstance.get('/admin/events', { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data;
      if (Array.isArray(data)) setEvents(data);
      else if (data && Array.isArray(data.data)) setEvents(data.data);
      else setEvents([]);
    } catch (err: any) {
      if (err?.response?.status === 403) setMessage('Accès refusé (403) pour récupérer les événements. Vérifiez vos permissions.');
      setEvents([]);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchEvents();
    }
  }, [user]);

  const createEvent = async () => {
    if (!newEventName.trim()) { setMessage("Veuillez saisir un nom d'événement."); return; }
    const token = localStorage.getItem('token'); if (!token) { setMessage("Vous devez être connecté."); return; }
    setIsCreatingEvent(true); setMessage('Création de l\'événement...');
    try {
      if (!checkAdminPermissions()) { setMessage('Accès refusé: droits administrateur requis.'); return; }
      const res = await axiosInstance.post('/admin/events', { name: newEventName }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (res?.data) setEvents(prev => [res.data, ...prev]); else await fetchEvents();
      setNewEventName(''); setMessage('Événement créé ✅');
    } catch (err: any) {
      if (err?.response?.status === 403) setMessage('Accès refusé (403) — droits insuffisants.'); else setMessage("Erreur lors de la création de l'événement.");
    } finally { setIsCreatingEvent(false); }
  };

  const createCompetition = async () => {
    if (!newCompetitionName.trim() || !selectedEventForCompetition) { setMessage("Veuillez saisir un nom de compétition ET sélectionner un événement."); return; }
    const token = localStorage.getItem('token'); if (!token) { setMessage("Vous devez être connecté."); return; }
    setIsCreatingCompetition(true); setMessage('Création de la compétition...');
    try {
      if (!checkAdminPermissions()) { setMessage('Accès refusé: droits administrateur requis.'); return; }
      const res = await axiosInstance.post(`/admin/events/${selectedEventForCompetition}/competitions`, { name: newCompetitionName }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (res?.data) {
        const createdCompetition = res.data;
        setEvents(prev => prev.map(event => {
          if (event.id !== selectedEventForCompetition) return event;
          const completeCompetition = { id: createdCompetition.id || `temp-${Date.now()}`, name: createdCompetition.name || newCompetitionName, eventId: selectedEventForCompetition, epreuves: [] };
          const updatedCompetitions = event.competitions ? [...event.competitions, completeCompetition] : [completeCompetition];
          return { ...event, competitions: updatedCompetitions };
        }));
      } else {
        await fetchEvents();
      }
      setNewCompetitionName(''); setSelectedEventForCompetition(''); setMessage('Compétition créée ✅');
    } catch (err: any) {
      if (err?.response?.status === 403) setMessage('Accès refusé (403) — droits insuffisants.'); else if (err?.response?.status === 404) setMessage('Événement non trouvé.'); else setMessage('Erreur lors de la création de la compétition.');
    } finally { setIsCreatingCompetition(false); }
  };

  const createEpreuve = async () => {
    if (!newEpreuveName.trim() || !selectedCompetitionForEpreuve) { setMessage("Veuillez saisir un nom d'épreuve ET sélectionner une compétition."); return; }
    const token = localStorage.getItem('token'); if (!token) { setMessage("Vous devez être connecté."); return; }
    setIsCreatingEpreuve(true); setMessage('Création de l\'épreuve...');
    try {
      if (!checkAdminPermissions()) { setMessage('Accès refusé: droits administrateur requis.'); return; }
      const res = await axiosInstance.post(`/admin/events/competitions/${selectedCompetitionForEpreuve}/epreuves`, { name: newEpreuveName }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (res?.data) {
        const createdEpreuve = res.data;
        setEvents(prev => prev.map(event => ({ ...event, competitions: event.competitions?.map(competition => {
          if (competition.id !== selectedCompetitionForEpreuve) return competition;
          const completeEpreuve = { id: createdEpreuve.id || `temp-epreuve-${Date.now()}`, name: createdEpreuve.name || newEpreuveName, competitionId: selectedCompetitionForEpreuve };
          const updatedEpreuves = competition.epreuves ? [...competition.epreuves, completeEpreuve] : [completeEpreuve];
          return { ...competition, epreuves: updatedEpreuves };
        }) } )));
      } else { await fetchEvents(); }
      setNewEpreuveName(''); setSelectedCompetitionForEpreuve(''); setMessage('Épreuve créée ✅');
    } catch (err: any) {
      if (err?.response?.status === 403) setMessage('Accès refusé (403).'); else if (err?.response?.status === 404) setMessage('Endpoint non trouvé (404).'); else setMessage("Erreur lors de la création de l'épreuve.");
    } finally { setIsCreatingEpreuve(false); }
  };

  const getAllCompetitions = () => {
    const competitions = events.flatMap(event => event.competitions?.map(competition => ({ ...competition, eventName: event.name, id: competition.id || '', name: competition.name || 'Compétition sans nom' })) || []);
    return competitions.filter(comp => comp.id);
  };

  const getSelectedEventName = () => {
    if (!selectedEventForCompetition) return '';
    const event = events.find(e => e.id === selectedEventForCompetition);
    return event ? event.name : 'Événement non trouvé';
  };

  const getSelectedCompetitionName = () => {
    if (!selectedCompetitionForEpreuve) return '';
    const competition = getAllCompetitions().find(c => c.id === selectedCompetitionForEpreuve);
    return competition ? competition.name : 'Compétition non trouvée';
  };

  return (
    <div style={{ marginTop: '2rem', background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Gestion des événements</h3>

      {/* Section 1 : Créer un événement */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
        <h4 style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>1. Créer un nouvel événement</h4>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="text" placeholder="Nom de l'événement" value={newEventName} onChange={e => setNewEventName(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', flex: 1 }} />
          <button onClick={createEvent} disabled={isCreatingEvent || !checkAdminPermissions()} style={{ backgroundColor: checkAdminPermissions() ? '#2563eb' : '#9ca3af', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: (isCreatingEvent || !checkAdminPermissions()) ? 'not-allowed' : 'pointer', opacity: isCreatingEvent ? 0.7 : 1 }}>{isCreatingEvent ? 'Création...' : 'Créer Événement'}</button>
        </div>
        {!checkAdminPermissions() && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>⚠️ Vous n'avez pas les permissions administrateur dans votre token.</p>}
      </div>

      {/* Section 2 : Créer une compétition */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
        <h4 style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>2. Créer une compétition dans un événement</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select value={selectedEventForCompetition} onChange={(e) => setSelectedEventForCompetition(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', flex: 1 }}>
              <option value="">-- Sélectionner un événement --</option>
              {events.map(event => <option key={event.id} value={event.id}>{event.name} (ID: {event.id})</option>)}
            </select>
            <input type="text" placeholder="Nom de la compétition" value={newCompetitionName} onChange={e => setNewCompetitionName(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={createCompetition} disabled={isCreatingCompetition || !selectedEventForCompetition || !newCompetitionName.trim() || !checkAdminPermissions()} style={{ backgroundColor: (selectedEventForCompetition && newCompetitionName.trim() && checkAdminPermissions()) ? '#16a34a' : '#9ca3af', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: (isCreatingCompetition || !selectedEventForCompetition || !newCompetitionName.trim() || !checkAdminPermissions()) ? 'not-allowed' : 'pointer' }}>{isCreatingCompetition ? 'Création...' : 'Créer Compétition'}</button>
            {selectedEventForCompetition && <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Événement sélectionné: {getSelectedEventName()}</span>}
          </div>
          {!selectedEventForCompetition && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>⚠️ Veuillez sélectionner un événement valide.</p>}
        </div>
      </div>

      {/* Section 3 : Créer une épreuve */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
        <h4 style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>3. Créer une épreuve dans une compétition</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select value={selectedCompetitionForEpreuve} onChange={(e) => setSelectedCompetitionForEpreuve(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', flex: 1 }}>
              <option value="">-- Sélectionner une compétition --</option>
              {getAllCompetitions().map(competition => <option key={competition.id} value={competition.id}>{competition.eventName} → {competition.name} (ID: {competition.id})</option>)}
            </select>
            <input type="text" placeholder="Nom de l'épreuve" value={newEpreuveName} onChange={e => setNewEpreuveName(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={createEpreuve} disabled={isCreatingEpreuve || !selectedCompetitionForEpreuve || !newEpreuveName.trim() || !checkAdminPermissions()} style={{ backgroundColor: (selectedCompetitionForEpreuve && newEpreuveName.trim() && checkAdminPermissions()) ? '#7c3aed' : '#9ca3af', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: (isCreatingEpreuve || !selectedCompetitionForEpreuve || !newEpreuveName.trim() || !checkAdminPermissions()) ? 'not-allowed' : 'pointer' }}>{isCreatingEpreuve ? 'Création...' : 'Créer Épreuve'}</button>
            {selectedCompetitionForEpreuve && <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Compétition sélectionnée: {getSelectedCompetitionName()}</span>}
          </div>
        </div>
      </div>

      {/* Liste des événements */}
      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Événements existants</h4>
        {events.length === 0 ? (
          <p style={{ color: '#6b7280' }}>Aucun événement créé pour le moment.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {events.map(event => (
              <div key={event.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>📅 {event.name} (ID: {event.id})</span>
                </div>

                {event.competitions && event.competitions.length > 0 ? (
                  <div style={{ marginLeft: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Compétitions :</p>
                    {event.competitions.map(competition => (
                      <div key={competition.id} style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: '600', color: '#374151' }}>🏆 {competition.name} (ID: {competition.id})</span>
                        </div>

                        {competition.epreuves && competition.epreuves.length > 0 ? (
                          <div style={{ marginLeft: '1rem' }}>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Épreuves :</p>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                              {competition.epreuves.map(epreuve => (
                                <li key={epreuve.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                                  <span style={{ color: '#4b5563' }}>🎯 {epreuve.name} (ID: {epreuve.id})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginLeft: '1rem' }}>Aucune épreuve créée pour cette compétition.</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginLeft: '1rem' }}>Aucune compétition créée pour cet événement.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
