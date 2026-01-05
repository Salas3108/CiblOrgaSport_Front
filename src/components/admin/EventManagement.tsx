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

interface Event {
  id: number;
  name: string;
  date: string;
  lieuPrincipal?: Lieu;
}

interface Competition {
  id: number;
  name: string;
  date: string;
  type: string;
  event?: Event;
  epreuves?: Epreuve[];
}

interface Epreuve {
  id: number;
  nom: string;
  description: string;
  competition?: Competition;
  lieu?: Lieu;
  date?: string;
}

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [lieux, setLieux] = useState<Lieu[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [editingEpreuve, setEditingEpreuve] = useState<Epreuve | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  const [expandedCompetitions, setExpandedCompetitions] = useState<Set<number>>(new Set());
  
  // Forms
  const [eventForm, setEventForm] = useState({ 
    name: '', 
    date: '',
    lieuPrincipalId: ''
  });
  const [competitionForm, setCompetitionForm] = useState({ 
    name: '', 
    date: '', 
    type: '' 
  });
  const [epreuveForm, setEpreuveForm] = useState({
    nom: '',
    description: '',
    lieuId: '',
    date: ''
  });

  // Helper: get start/end from event/competition objects (supports single-date fallback)
  const getRangeFrom = (obj: any) => {
    if (!obj) return { start: null, end: null };
    const start = obj.startDate || obj.dateDebut || obj.dateStart || obj.date || null;
    const end = obj.endDate || obj.dateFin || obj.dateEnd || obj.date || null;
    return { start, end };
  };

  const isDateWithin = (dateStr: string | undefined | null, startStr: string | null, endStr: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (!startStr && !endStr) return true;
    const s = startStr ? new Date(startStr) : d;
    const e = endStr ? new Date(endStr) : d;
    return d >= s && d <= e;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsData, competitionsData, epreuvesData, lieuxData] = await Promise.all([
        eventsService.adminGetEvents(),
        eventsService.getCompetitions(),
        eventsService.getEpreuves(),
        eventsService.getLieux()
      ]);
      
      // Associer les épreuves aux compétitions
      const competitionsWithEpreuves = competitionsData.map((comp: Competition) => ({
        ...comp,
        epreuves: epreuvesData.filter((epr: Epreuve) => epr.competition?.id === comp.id)
      }));
      
      setEvents(eventsData);
      setCompetitions(competitionsWithEpreuves);
      setLieux(lieuxData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const eventData: any = {
        name: eventForm.name,
        date: eventForm.date
      };
      if (eventForm.lieuPrincipalId) {
        eventData.lieuPrincipalId = parseInt(eventForm.lieuPrincipalId);
      }
      await eventsService.adminCreateEvent(eventData);
      setEventForm({ name: '', date: '', lieuPrincipalId: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create event:', error);
      setError('Erreur lors de la création de l\'événement');
    }
  };

  const handleAddCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    // Validation: competition date must fall into the event date/range (if provided)
    const eventObj = events.find(ev => ev.id === selectedEvent);
    if (!eventObj) {
      setError('Événement introuvable.');
      return;
    }
    const { start: evStart, end: evEnd } = getRangeFrom(eventObj as any);
    if (competitionForm.date) {
      if (!isDateWithin(competitionForm.date, evStart, evEnd)) {
        setError("La date de la compétition doit être comprise dans la période de l'événement.");
        return;
      }
    }

    try {
      await eventsService.adminAddCompetitionToEvent(selectedEvent, competitionForm);
      setCompetitionForm({ name: '', date: '', type: '' });
      setError(null);
      loadData();
    } catch (error) {
      console.error('Failed to add competition:', error);
      setError('Erreur lors de l\'ajout de la compétition');
    }
  };

  const handleUpdateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompetition) return;
    
    try {
      await eventsService.updateCompetition(editingCompetition.id, {
        name: editingCompetition.name,
        date: editingCompetition.date,
        type: editingCompetition.type
      });
      setEditingCompetition(null);
      loadData();
    } catch (error) {
      console.error('Failed to update competition:', error);
      setError('Erreur lors de la modification de la compétition');
    }
  };

  const handleDeleteCompetition = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette compétition ?')) return;
    try {
      await eventsService.deleteCompetition(id);
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleAddEpreuve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompetition) return;
    // Validation: competition must belong to selectedEvent (if any) and no duplicate epreuve names
    const compObj = competitions.find(c => c.id === selectedCompetition);
    if (!compObj) {
      setError('Compétition introuvable.');
      return;
    }
    // If a selectedEvent is set, ensure the competition belongs to it
    if (selectedEvent && compObj.event && compObj.event.id !== selectedEvent) {
      setError('La compétition sélectionnée n\'appartient pas à l\'événement courant.');
      return;
    }

    if (!epreuveForm.nom || epreuveForm.nom.trim().length < 2) {
      setError('Le nom de l\'épreuve est trop court.');
      return;
    }
    const exists = compObj.epreuves && compObj.epreuves.some((ep: any) => ep.nom === epreuveForm.nom);
    if (exists) {
      setError('Une épreuve avec ce nom existe déjà dans cette compétition.');
      return;
    }

    // If epreuve has a date, ensure it lies within the competition date/range
    if (epreuveForm.date) {
      const { start: compStart, end: compEnd } = getRangeFrom(compObj as any);
      if (!isDateWithin(epreuveForm.date, compStart, compEnd)) {
        setError("La date de l'épreuve doit être comprise dans la période de la compétition.");
        return;
      }
    }

    try {
      const epreuveData: any = {
        nom: epreuveForm.nom,
        description: epreuveForm.description
      };
      if (epreuveForm.lieuId) {
        epreuveData.lieuId = parseInt(epreuveForm.lieuId);
      }
      if (epreuveForm.date) {
        epreuveData.date = epreuveForm.date;
      }
      await eventsService.adminAddEpreuveToCompetition(selectedCompetition, epreuveData);
      setEpreuveForm({ nom: '', description: '', lieuId: '', date: '' });
      setError(null);
      loadData();
    } catch (error) {
      console.error('Failed to add epreuve:', error);
      setError('Erreur lors de l\'ajout de l\'épreuve');
    }
  };

  const handleUpdateEpreuve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEpreuve) return;
    // Validate date is within its competition range (if date provided)
    try {
      // find parent competition for this epreuve
      const compObj = competitions.find(c => c.epreuves && c.epreuves.some((ep: any) => ep.id === editingEpreuve.id));
      if (editingEpreuve.date && compObj) {
        const { start: compStart, end: compEnd } = getRangeFrom(compObj as any);
        if (!isDateWithin(editingEpreuve.date, compStart, compEnd)) {
          setError("La date de l'épreuve doit être comprise dans la période de la compétition.");
          return;
        }
      }

      const epreuveData: any = {
        nom: editingEpreuve.nom,
        description: editingEpreuve.description
      };
      if (editingEpreuve.lieu?.id) {
        epreuveData.lieuId = editingEpreuve.lieu.id;
      }
      if (editingEpreuve.date) {
        epreuveData.date = editingEpreuve.date;
      }
      await eventsService.updateEpreuve(editingEpreuve.id, epreuveData);
      setEditingEpreuve(null);
      setError(null);
      loadData();
    } catch (error) {
      console.error('Failed to update epreuve:', error);
      setError('Erreur lors de la modification de l\'épreuve');
    }
  };

  const handleDeleteEpreuve = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette épreuve ?')) return;
    try {
      await eventsService.deleteEpreuve(id);
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;
    try {
      await eventsService.adminDeleteEvent(id);
      loadData();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    }
  };

  const toggleEventExpanded = (eventId: number) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const toggleCompetitionExpanded = (competitionId: number) => {
    setExpandedCompetitions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(competitionId)) {
        newSet.delete(competitionId);
      } else {
        newSet.add(competitionId);
      }
      return newSet;
    });
  };

  const getEventCompetitions = (eventId: number) => {
    return competitions.filter(comp => comp.event?.id === eventId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Chargement des événements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Événements</h1>
        <p className="mt-2 text-gray-600">Créez et gérez vos événements et compétitions</p>
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
        {/* Create Event Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Nouvel Événement</h3>
                <p className="text-sm text-gray-500">Créez un nouvel événement</p>
              </div>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'événement
                </label>
                <input
                  type="text"
                  placeholder="Ex: Jeux Olympiques 2024"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu Principal (optionnel)
                </label>
                <select
                  value={eventForm.lieuPrincipalId}
                  onChange={(e) => setEventForm({...eventForm, lieuPrincipalId: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Sélectionner un lieu</option>
                  {lieux.map((lieu) => (
                    <option key={lieu.id} value={lieu.id}>
                      {lieu.nom} - {lieu.ville}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Créer l'événement
              </button>
            </form>
          </div>
        </div>

        {/* Events List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Événements existants</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {events.length} événement{events.length !== 1 ? 's' : ''} trouvé{events.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Actualiser
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun événement</h4>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    Commencez par créer votre premier événement en utilisant le formulaire à gauche.
                  </p>
                </div>
              ) : (
                events.map((event) => {
                  const eventCompetitions = getEventCompetitions(event.id);
                  const isExpanded = expandedEvents.has(event.id);
                  
                  return (
                  <div key={event.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{event.name}</h4>
                          <div className="flex items-center mt-1 space-x-4">
                            <span className="inline-flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(event.date)}
                            </span>
                            <span className="inline-flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {eventCompetitions.length} compétition{eventCompetitions.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 sm:mt-0">
                          {eventCompetitions.length > 0 && (
                            <button
                              onClick={() => toggleEventExpanded(event.id)}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              {isExpanded ? 'Masquer' : 'Voir'} compétitions
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              selectedEvent === event.id 
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500' 
                                : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                            }`}
                          >
                            {selectedEvent === event.id ? 'Fermer' : '+ Compétition'}
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Liste des compétitions */}
                    {isExpanded && eventCompetitions.length > 0 && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3">Compétitions</h5>
                        <div className="space-y-2">
                          {eventCompetitions.map((comp) => {
                            const isCompExpanded = expandedCompetitions.has(comp.id);
                            return (
                            <div key={comp.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <div className="flex items-center justify-between p-3">
                                <div className="flex-1">
                                  {editingCompetition?.id === comp.id ? (
                                    <form onSubmit={handleUpdateCompetition} className="space-y-2">
                                      <input
                                        type="text"
                                        value={editingCompetition.name}
                                        onChange={(e) => setEditingCompetition({...editingCompetition, name: e.target.value})}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                        required
                                      />
                                      <div className="flex gap-2">
                                        <input
                                          type="date"
                                          value={editingCompetition.date}
                                          onChange={(e) => setEditingCompetition({...editingCompetition, date: e.target.value})}
                                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                          required
                                        />
                                        <select
                                          value={editingCompetition.type}
                                          onChange={(e) => setEditingCompetition({...editingCompetition, type: e.target.value})}
                                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                          required
                                        >
                                          <option value="Natation">Natation</option>
                                          <option value="Athlétisme">Athlétisme</option>
                                          <option value="Cyclisme">Cyclisme</option>
                                          <option value="Triathlon">Triathlon</option>
                                        </select>
                                      </div>
                                      <div className="flex gap-2">
                                        <button type="submit" className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                                          Sauvegarder
                                        </button>
                                        <button 
                                          type="button" 
                                          onClick={() => setEditingCompetition(null)}
                                          className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                        >
                                          Annuler
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <>
                                      <div className="font-medium text-gray-900">{comp.name}</div>
                                      <div className="text-sm text-gray-500">
                                        {comp.type} • {formatDate(comp.date)}
                                        {comp.epreuves && comp.epreuves.length > 0 && (
                                          <span className="ml-2 text-blue-600 font-medium">
                                            • {comp.epreuves.length} épreuve{comp.epreuves.length !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                                {!editingCompetition && (
                                  <div className="flex gap-1 ml-2">
                                    <button
                                      onClick={() => toggleCompetitionExpanded(comp.id)}
                                      className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100 font-medium"
                                      title={isCompExpanded ? 'Masquer les épreuves' : 'Voir les épreuves'}
                                    >
                                      {isCompExpanded ? '▼ Masquer' : '▶ Voir'} ({comp.epreuves?.length || 0})
                                    </button>
                                    <button
                                      onClick={() => setSelectedCompetition(selectedCompetition === comp.id ? null : comp.id)}
                                      className="px-2 py-1 text-xs text-green-600 bg-green-50 rounded hover:bg-green-100"
                                      title="Ajouter une épreuve"
                                    >
                                      + Épreuve
                                    </button>
                                    <button
                                      onClick={() => setEditingCompetition(comp)}
                                      className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                      title="Modifier"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCompetition(comp.id)}
                                      className="px-2 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100"
                                      title="Supprimer"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Liste des épreuves */}
                              {isCompExpanded && (
                                <div className="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
                                  <h6 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">
                                    📋 Épreuves ({comp.epreuves?.length || 0})
                                  </h6>
                                  {comp.epreuves && comp.epreuves.length > 0 ? (
                                    <div className="space-y-2">
                                      {comp.epreuves.map((epreuve) => (
                                        <div key={epreuve.id} className="bg-white rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                                          {editingEpreuve?.id === epreuve.id ? (
                                            <form onSubmit={handleUpdateEpreuve} className="p-3 space-y-2">
                                              <input
                                                type="text"
                                                value={editingEpreuve.nom}
                                                onChange={(e) => setEditingEpreuve({...editingEpreuve, nom: e.target.value})}
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                placeholder="Nom de l'épreuve"
                                                required
                                              />
                                              <textarea
                                                value={editingEpreuve.description}
                                                onChange={(e) => setEditingEpreuve({...editingEpreuve, description: e.target.value})}
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                placeholder="Description"
                                                rows={2}
                                                required
                                              />
                                                <div>
                                                  <label className="block text-xs font-medium text-gray-700 mb-1">Date (optionnel)</label>
                                                  <input
                                                    type="date"
                                                    value={editingEpreuve.date || ''}
                                                    onChange={(e) => setEditingEpreuve({...editingEpreuve, date: e.target.value})}
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                  />
                                                </div>
                                              <select
                                                value={editingEpreuve.lieu?.id || ''}
                                                onChange={(e) => {
                                                  const lieuId = e.target.value ? parseInt(e.target.value) : null;
                                                  const lieu = lieuId ? lieux.find(l => l.id === lieuId) : undefined;
                                                  setEditingEpreuve({...editingEpreuve, lieu});
                                                }}
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                              >
                                                <option value="">Lieu (optionnel)</option>
                                                {lieux.map((lieu) => (
                                                  <option key={lieu.id} value={lieu.id}>
                                                    {lieu.nom} - {lieu.ville}
                                                  </option>
                                                ))}
                                              </select>
                                              <div className="flex gap-2">
                                                <button type="submit" className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
                                                  Sauvegarder
                                                </button>
                                                <button 
                                                  type="button" 
                                                  onClick={() => setEditingEpreuve(null)}
                                                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                                >
                                                  Annuler
                                                </button>
                                              </div>
                                            </form>
                                          ) : (
                                            <div className="flex items-center justify-between px-3 py-2.5">
                                              <div className="flex-1">
                                                <div className="font-semibold text-gray-900 text-sm">{epreuve.nom}</div>
                                                <div className="text-xs text-gray-600 mt-1">
                                                  {epreuve.description}
                                                </div>
                                                {epreuve.lieu && (
                                                  <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {epreuve.lieu.nom}
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded mr-1">
                                                  #{epreuve.id}
                                                </span>
                                                <button
                                                  onClick={() => setEditingEpreuve(epreuve)}
                                                  className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                                  title="Modifier"
                                                >
                                                  ✏️
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteEpreuve(epreuve.id)}
                                                  className="px-2 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100"
                                                  title="Supprimer"
                                                >
                                                  🗑️
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-sm text-gray-500">
                                      Aucune épreuve pour le moment. Cliquez sur "+ Épreuve" pour en ajouter.
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Formulaire d'ajout d'épreuve */}
                              {selectedCompetition === comp.id && (
                                <div className="border-t border-gray-200 bg-blue-50 p-3">
                                  <h6 className="text-xs font-semibold text-gray-900 mb-2">Ajouter une épreuve</h6>
                                  <form onSubmit={handleAddEpreuve} className="space-y-2">
                                    <input
                                      type="text"
                                      placeholder="Nom de l'épreuve"
                                      value={epreuveForm.nom}
                                      onChange={(e) => setEpreuveForm({...epreuveForm, nom: e.target.value})}
                                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                      required
                                    />
                                    <textarea
                                      placeholder="Description"
                                      value={epreuveForm.description}
                                      onChange={(e) => setEpreuveForm({...epreuveForm, description: e.target.value})}
                                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                      rows={2}
                                      required
                                    />
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Date (optionnel)</label>
                                      <input
                                        type="date"
                                        value={epreuveForm.date}
                                        onChange={(e) => setEpreuveForm({...epreuveForm, date: e.target.value})}
                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>
                                    <select
                                      value={epreuveForm.lieuId}
                                      onChange={(e) => setEpreuveForm({...epreuveForm, lieuId: e.target.value})}
                                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                    >
                                      <option value="">Lieu (optionnel)</option>
                                      {lieux.map((lieu) => (
                                        <option key={lieu.id} value={lieu.id}>
                                          {lieu.nom} - {lieu.ville}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="flex gap-2">
                                      <button 
                                        type="submit" 
                                        className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                      >
                                        Ajouter
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => setSelectedCompetition(null)}
                                        className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                      >
                                        Annuler
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              )}
                            </div>
                          )})}
                        </div>
                      </div>
                    )}

                    {selectedEvent === event.id && (
                      <div className="border-t border-gray-200">
                        <div className="p-6 bg-white">
                          <div className="mb-6">
                            <h5 className="text-md font-semibold text-gray-900 mb-4">Ajouter une compétition</h5>
                            <form onSubmit={handleAddCompetition} className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Nom de la compétition
                                </label>
                                <input
                                  type="text"
                                  placeholder="Ex: 100m nage libre"
                                  value={competitionForm.name}
                                  onChange={(e) => setCompetitionForm({...competitionForm, name: e.target.value})}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date
                                  </label>
                                  <input
                                    type="date"
                                    value={competitionForm.date}
                                    onChange={(e) => setCompetitionForm({...competitionForm, date: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                  </label>
                                  <select
                                    value={competitionForm.type}
                                    onChange={(e) => setCompetitionForm({...competitionForm, type: e.target.value})}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    required
                                  >
                                    <option value="">Sélectionner un type</option>
                                    <option value="Natation">Natation</option>
                                    <option value="Athlétisme">Athlétisme</option>
                                    <option value="Cyclisme">Cyclisme</option>
                                    <option value="Triathlon">Triathlon</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <button 
                                  type="submit" 
                                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                  Ajouter la compétition
                                </button>
                              </div>
                            </form>
                          </div>

                          {/* Existing Competitions */}
                          {event.competitions && event.competitions.length > 0 && (
                            <div className="border-t border-gray-200 pt-6">
                              <h6 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                                Compétitions existantes
                              </h6>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {event.competitions.map((competition) => (
                                  <div 
                                    key={competition.id} 
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <h6 className="font-medium text-gray-900">{competition.name}</h6>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        competition.type === 'Natation' ? 'bg-blue-100 text-blue-800' :
                                        competition.type === 'Athlétisme' ? 'bg-green-100 text-green-800' :
                                        competition.type === 'Cyclisme' ? 'bg-purple-100 text-purple-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {competition.type}
                                      </span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {formatDate(competition.date)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )})
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}