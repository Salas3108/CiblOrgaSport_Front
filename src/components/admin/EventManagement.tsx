'use client';
import React, { useState, useEffect } from 'react';
import {
  adminListEvents, adminCreateEvent,
  addCompetitionToEvent
} from '@/src/api/eventService';

interface Event {
  id: string;
  name: string;
  dateDebut: string;
  dateFin: string;
  competitions?: Competition[];
}

interface Competition {
  id: string;
  name: string;
  date: string;
  type: string;
}

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Forms
  const [eventForm, setEventForm] = useState({ 
    name: '', 
    dateDebut: '', 
    dateFin: '', 
    description: '' 
  });
  const [competitionForm, setCompetitionForm] = useState({ 
    name: '', 
    date: '', 
    type: '' 
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventsData = await adminListEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to load events:', error);
      setError('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateEvent(eventForm);
      setEventForm({ name: '', dateDebut: '', dateFin: '', description: '' });
      loadEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      setError('Erreur lors de la création de l\'événement');
    }
  };

  const handleAddCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    try {
      await addCompetitionToEvent(selectedEvent, competitionForm);
      setCompetitionForm({ name: '', date: '', type: '' });
      loadEvents();
    } catch (error) {
      console.error('Failed to add competition:', error);
      setError('Erreur lors de l\'ajout de la compétition');
    }
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={eventForm.dateDebut}
                    onChange={(e) => setEventForm({...eventForm, dateDebut: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={eventForm.dateFin}
                    onChange={(e) => setEventForm({...eventForm, dateFin: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Décrivez votre événement..."
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
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
                  onClick={loadEvents}
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
                events.map((event) => (
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
                              {formatDate(event.dateDebut)} → {formatDate(event.dateFin)}
                            </span>
                            <span className="inline-flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              {event.competitions?.length || 0} compétition{event.competitions?.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                          className={`mt-3 sm:mt-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            selectedEvent === event.id 
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500' 
                              : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                          }`}
                        >
                          {selectedEvent === event.id ? (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Fermer
                            </span>
                          ) : (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Ajouter une compétition
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

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
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}