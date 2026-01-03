'use client';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Incident {
  id: string;
  title: string;
  description: string;
  type: 'crowd' | 'technical' | 'medical' | 'security' | 'weather' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  eventId?: string;
  eventName?: string;
  status: 'active' | 'resolved' | 'investigating';
  createdAt: string;
  updatedAt: string;
  reportedBy: {
    id: string;
    name: string;
    role: 'admin' | 'commissioner' | 'volunteer';
  };
  affectedAreas?: string[];
  actionTaken?: string;
  resolvedAt?: string;
}

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

interface IncidentStats {
  active: number;
  resolved: number;
  critical: number;
  today: number;
}

// Données simulées
const mockIncidents: Incident[] = [
  {
    id: 'INC-001',
    title: 'Mouvement de foule important',
    description: 'Affluence anormale à l\'entrée principale du stade. Risque de bousculade.',
    type: 'crowd',
    severity: 'high',
    location: 'Entrée principale - Stade Olympique',
    eventId: 'EVENT-001',
    eventName: 'Finales d\'Athlétisme',
    status: 'active',
    createdAt: '2024-07-25T14:30:00',
    updatedAt: '2024-07-25T14:45:00',
    reportedBy: {
      id: 'USER-001',
      name: 'Pierre Martin',
      role: 'commissioner'
    },
    affectedAreas: ['Entrée Nord', 'Zone de contrôle'],
    actionTaken: 'Renforcement de la sécurité, ouverture de portes supplémentaires'
  },
  {
    id: 'INC-002',
    title: 'Problème technique système son',
    description: 'Le système de sonorisation de la tribune Ouest ne fonctionne plus.',
    type: 'technical',
    severity: 'medium',
    location: 'Tribune Ouest - Stade Nautique',
    eventId: 'EVENT-002',
    eventName: 'Compétition de Natation',
    status: 'investigating',
    createdAt: '2024-07-25T10:15:00',
    updatedAt: '2024-07-25T10:45:00',
    reportedBy: {
      id: 'USER-002',
      name: 'Sophie Bernard',
      role: 'admin'
    },
    affectedAreas: ['Tribune Ouest'],
    actionTaken: 'Techniciens sur place, système de secours activé'
  },
  {
    id: 'INC-003',
    title: 'Malaise spectateur',
    description: 'Spectateur ressentant des malaises en zone de restauration.',
    type: 'medical',
    severity: 'medium',
    location: 'Zone de restauration - Secteur B',
    status: 'resolved',
    createdAt: '2024-07-24T16:20:00',
    updatedAt: '2024-07-24T16:45:00',
    resolvedAt: '2024-07-24T16:45:00',
    reportedBy: {
      id: 'USER-003',
      name: 'Jean Dubois',
      role: 'volunteer'
    },
    actionTaken: 'Prise en charge par le service médical, évacuation vers l\'infirmerie'
  },
  {
    id: 'INC-004',
    title: 'Suspicion objet suspect',
    description: 'Sac abandonné près des vestiaires.',
    type: 'security',
    severity: 'critical',
    location: 'Vestiaires Athlètes - Bâtiment Est',
    eventId: 'EVENT-003',
    eventName: 'Finales de Gymnastique',
    status: 'active',
    createdAt: '2024-07-25T09:00:00',
    updatedAt: '2024-07-25T09:30:00',
    reportedBy: {
      id: 'USER-004',
      name: 'Marie Laurent',
      role: 'commissioner'
    },
    affectedAreas: ['Zone Est', 'Vestiaires'],
    actionTaken: 'Zone sécurisée, intervention des forces de l\'ordre'
  },
  {
    id: 'INC-005',
    title: 'Problème d\'éclairage',
    description: 'Panneaux d\'éclairage partiellement défaillants sur le parcours.',
    type: 'technical',
    severity: 'low',
    location: 'Parcours Triathlon - Secteur 3',
    eventId: 'EVENT-004',
    eventName: 'Épreuves de Triathlon',
    status: 'resolved',
    createdAt: '2024-07-23T18:45:00',
    updatedAt: '2024-07-23T19:30:00',
    resolvedAt: '2024-07-23T19:30:00',
    reportedBy: {
      id: 'USER-005',
      name: 'Thomas Petit',
      role: 'volunteer'
    },
    actionTaken: 'Réparation effectuée, vérification du circuit'
  }
];

const mockEvents: Event[] = [
  { id: 'EVENT-001', name: 'Finales d\'Athlétisme', date: '2024-07-25', location: 'Stade Olympique', status: 'ongoing' },
  { id: 'EVENT-002', name: 'Compétition de Natation', date: '2024-07-25', location: 'Stade Nautique', status: 'ongoing' },
  { id: 'EVENT-003', name: 'Finales de Gymnastique', date: '2024-07-26', location: 'Palais des Sports', status: 'upcoming' },
  { id: 'EVENT-004', name: 'Épreuves de Triathlon', date: '2024-07-28', location: 'Parc Triathlon', status: 'upcoming' },
  { id: 'EVENT-005', name: 'Compétition de Cyclisme', date: '2024-07-24', location: 'Vélodrome National', status: 'completed' }
];

export default function IncidentPage() {
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [events] = useState<Event[]>(mockEvents);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    severity: 'all',
    date: 'all'
  });
  const [newIncident, setNewIncident] = useState({
    title: '',
    description: '',
    type: 'technical' as Incident['type'],
    severity: 'medium' as Incident['severity'],
    location: '',
    eventId: '',
    affectedAreas: [] as string[],
    actionTaken: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRole] = useState<'user' | 'volunteer' | 'commissioner' | 'admin'>('commissioner');

  // Calculer les statistiques
  const stats: IncidentStats = {
    active: incidents.filter(i => i.status === 'active').length,
    resolved: incidents.filter(i => i.status === 'resolved').length,
    critical: incidents.filter(i => i.severity === 'critical').length,
    today: incidents.filter(i => {
      const today = new Date().toDateString();
      return new Date(i.createdAt).toDateString() === today;
    }).length
  };

  useEffect(() => {
    // Ici, vous feriez normalement des appels API
    // setIncidents(await getIncidents());
    // setEvents(await getEvents());
  }, []);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simuler un appel API
    setTimeout(() => {
      const incident: Incident = {
        id: `INC-${Date.now().toString().slice(-6)}`,
        title: newIncident.title,
        description: newIncident.description,
        type: newIncident.type,
        severity: newIncident.severity,
        location: newIncident.location,
        eventId: newIncident.eventId || undefined,
        eventName: newIncident.eventId ? events.find(e => e.id === newIncident.eventId)?.name : undefined,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reportedBy: {
          id: 'USER-CURRENT',
          name: 'Vous',
          role: userRole as any
        },
        affectedAreas: newIncident.affectedAreas,
        actionTaken: newIncident.actionTaken
      };

      setIncidents([incident, ...incidents]);
      setNewIncident({
        title: '',
        description: '',
        type: 'technical',
        severity: 'medium',
        location: '',
        eventId: '',
        affectedAreas: [],
        actionTaken: ''
      });
      setShowReportForm(false);
      setLoading(false);
    }, 1000);
  };

  const handleUpdateStatus = (incidentId: string, status: Incident['status']) => {
    setIncidents(incidents.map(incident => {
      if (incident.id === incidentId) {
        return {
          ...incident,
          status,
          updatedAt: new Date().toISOString(),
          ...(status === 'resolved' ? { resolvedAt: new Date().toISOString() } : {})
        };
      }
      return incident;
    }));
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'à' HH:mm", { locale: fr });
  };

  const getStatusColor = (status: Incident['status']) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: Incident['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Incident['type']) => {
    switch (type) {
      case 'crowd':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'technical':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'medical':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'security':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'weather':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  const getTypeLabel = (type: Incident['type']) => {
    switch (type) {
      case 'crowd': return 'Foule';
      case 'technical': return 'Technique';
      case 'medical': return 'Médical';
      case 'security': return 'Sécurité';
      case 'weather': return 'Météo';
      case 'other': return 'Autre';
    }
  };

  const getSeverityLabel = (severity: Incident['severity']) => {
    switch (severity) {
      case 'critical': return 'Critique';
      case 'high': return 'Élevée';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
    }
  };

  // Filtrer les incidents
  const filteredIncidents = incidents.filter(incident => {
    if (filters.status !== 'all' && incident.status !== filters.status) return false;
    if (filters.type !== 'all' && incident.type !== filters.type) return false;
    if (filters.severity !== 'all' && incident.severity !== filters.severity) return false;
    if (searchQuery && !incident.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !incident.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const canReportIncident = ['admin', 'commissioner', 'volunteer'].includes(userRole);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Incidents</h1>
            <p className="mt-2 text-gray-600">Surveillance et déclaration des incidents en temps réel</p>
          </div>
          {canReportIncident && (
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setShowReportForm(true)}
                className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Déclarer un incident
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Incidents actifs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Résolus</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.resolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Critiques</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.critical}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Aujourd'hui</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.today}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un incident..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="investigating">En cours</option>
              <option value="resolved">Résolu</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="crowd">Foule</option>
              <option value="technical">Technique</option>
              <option value="medical">Médical</option>
              <option value="security">Sécurité</option>
              <option value="weather">Météo</option>
              <option value="other">Autre</option>
            </select>

            <select
              value={filters.severity}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toutes les gravités</option>
              <option value="critical">Critique</option>
              <option value="high">Élevée</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Historique des incidents ({filteredIncidents.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun incident trouvé</h4>
              <p className="text-gray-500 max-w-sm mx-auto">
                {searchQuery ? 'Aucun incident ne correspond à votre recherche' : 'Aucun incident à afficher avec les filtres actuels'}
              </p>
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <div key={incident.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start mb-3">
                      <div className={`p-2 rounded-lg ${getSeverityColor(incident.severity)} mr-3`}>
                        {getTypeIcon(incident.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{incident.title}</h4>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                                {incident.status === 'active' ? 'Actif' : incident.status === 'investigating' ? 'En cours' : 'Résolu'}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {getTypeLabel(incident.type)}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                                {getSeverityLabel(incident.severity)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:mt-0">
                            <button
                              onClick={() => {
                                setSelectedIncident(incident);
                                setShowIncidentModal(true);
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Voir les détails
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">{incident.description}</p>
                        
                        <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {incident.location}
                          </span>
                          {incident.eventName && (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {incident.eventName}
                            </span>
                          )}
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDateTime(incident.createdAt)}
                          </span>
                        </div>

                        {incident.affectedAreas && incident.affectedAreas.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm font-medium text-gray-700 mr-2">Zones affectées:</span>
                            <div className="inline-flex flex-wrap gap-1">
                              {incident.affectedAreas.map((area, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for authorized users */}
                  {canReportIncident && incident.status !== 'resolved' && (
                    <div className="mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                        <button
                          onClick={() => handleUpdateStatus(incident.id, 'resolved')}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Marquer résolu
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(incident.id, 'investigating')}
                          className="px-3 py-1.5 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                        >
                          En cours
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Report Incident Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Déclarer un nouvel incident</h3>
                <button
                  onClick={() => setShowReportForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleReportIncident} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre de l'incident *
                  </label>
                  <input
                    type="text"
                    value={newIncident.title}
                    onChange={(e) => setNewIncident({...newIncident, title: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Mouvement de foule à l'entrée"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description détaillée *
                  </label>
                  <textarea
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Décrivez précisément l'incident..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type d'incident *
                    </label>
                    <select
                      value={newIncident.type}
                      onChange={(e) => setNewIncident({...newIncident, type: e.target.value as Incident['type']})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="crowd">Mouvement de foule</option>
                      <option value="technical">Problème technique</option>
                      <option value="medical">Incident médical</option>
                      <option value="security">Sécurité</option>
                      <option value="weather">Météo</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Niveau de gravité *
                    </label>
                    <select
                      value={newIncident.severity}
                      onChange={(e) => setNewIncident({...newIncident, severity: e.target.value as Incident['severity']})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="low">Faible</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Élevée</option>
                      <option value="critical">Critique</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Localisation précise *
                  </label>
                  <input
                    type="text"
                    value={newIncident.location}
                    onChange={(e) => setNewIncident({...newIncident, location: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Entrée principale, Tribune Ouest, Zone de restauration..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Événement concerné (optionnel)
                  </label>
                  <select
                    value={newIncident.eventId}
                    onChange={(e) => setNewIncident({...newIncident, eventId: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sélectionner un événement</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>{event.name} - {event.location}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zones affectées (optionnel)
                  </label>
                  <input
                    type="text"
                    value={newIncident.affectedAreas.join(', ')}
                    onChange={(e) => setNewIncident({...newIncident, affectedAreas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Séparez par des virgules: Zone A, Entrée Nord, Restauration..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actions déjà prises (optionnel)
                  </label>
                  <textarea
                    value={newIncident.actionTaken}
                    onChange={(e) => setNewIncident({...newIncident, actionTaken: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Décrivez les mesures déjà mises en place..."
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="px-4 py-2.5 text-gray-700 font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Déclaration en cours...
                      </span>
                    ) : (
                      'Déclarer l\'incident'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Incident Details Modal */}
      {showIncidentModal && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedIncident.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedIncident.status)}`}>
                      {selectedIncident.status === 'active' ? 'Actif' : selectedIncident.status === 'investigating' ? 'En cours' : 'Résolu'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getTypeLabel(selectedIncident.type)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(selectedIncident.severity)}`}>
                      {getSeverityLabel(selectedIncident.severity)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowIncidentModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{selectedIncident.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Informations</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Localisation</p>
                        <p className="text-gray-900 font-medium">{selectedIncident.location}</p>
                      </div>
                      {selectedIncident.eventName && (
                        <div>
                          <p className="text-sm text-gray-500">Événement</p>
                          <p className="text-gray-900 font-medium">{selectedIncident.eventName}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Déclaré par</p>
                        <p className="text-gray-900 font-medium">{selectedIncident.reportedBy.name}</p>
                        <p className="text-sm text-gray-600 capitalize">{selectedIncident.reportedBy.role}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Dates</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Déclaré le</p>
                        <p className="text-gray-900">{formatDateTime(selectedIncident.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dernière mise à jour</p>
                        <p className="text-gray-900">{formatDateTime(selectedIncident.updatedAt)}</p>
                      </div>
                      {selectedIncident.resolvedAt && (
                        <div>
                          <p className="text-sm text-gray-500">Résolu le</p>
                          <p className="text-gray-900">{formatDateTime(selectedIncident.resolvedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedIncident.affectedAreas && selectedIncident.affectedAreas.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Zones affectées</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedIncident.affectedAreas.map((area, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {selectedIncident.actionTaken && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Actions prises</h4>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{selectedIncident.actionTaken}</p>
                  </div>
                )}

                {canReportIncident && selectedIncident.status !== 'resolved' && (
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Mettre à jour le statut</h4>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedIncident.id, 'resolved');
                          setShowIncidentModal(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Marquer comme résolu
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedIncident.id, 'investigating');
                          setShowIncidentModal(false);
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        En cours d'investigation
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowIncidentModal(false)}
                      className="px-4 py-2 text-gray-700 font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}