'use client';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Incident {
  id: number;
  description: string;
  impactLevel: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';
  type: 'SECURITE' | 'TECHNIQUE' | 'METEO' | 'MEDICAL' | 'AUTRE';
  location: string;
  status: 'ACTIF' | 'RESOLU';
  reportedBy: string;
  reportedAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
}

interface IncidentStats {
  active: number;
  resolved: number;
  critical: number;
  today: number;
}

export default function IncidentPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    impactLevel: 'all',
  });
  const [newIncident, setNewIncident] = useState({
    description: '',
    type: 'TECHNIQUE' as Incident['type'],
    impactLevel: 'MOYEN' as Incident['impactLevel'],
    location: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Récupérer les incidents depuis l'API
  const fetchIncidents = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/incidents', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Accès interdit. Vérifiez vos permissions.');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      setIncidents(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des incidents:', error);
      setError(error instanceof Error ? error.message : 'Impossible de charger les incidents. Veuillez réessayer.');
    } finally {
      setIsFetching(false);
    }
  };

  // Décoder le token pour obtenir le rôle
  const decodeToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const decoded = JSON.parse(jsonPayload);
      return decoded.roles || decoded.role || decoded.authorities?.[0] || null;
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  };

  // Calculer les statistiques
  const stats: IncidentStats = {
    active: incidents.filter(i => i.status === 'ACTIF').length,
    resolved: incidents.filter(i => i.status === 'RESOLU').length,
    critical: incidents.filter(i => i.impactLevel === 'CRITIQUE').length,
    today: incidents.filter(i => {
      const today = new Date().toDateString();
      return new Date(i.reportedAt).toDateString() === today;
    }).length
  };

  useEffect(() => {
    // Récupérer le rôle depuis le token
    const role = decodeToken();
    setUserRole(role);
    
    // Charger les incidents
    fetchIncidents();
  }, []);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: newIncident.description,
          type: newIncident.type,
          impactLevel: newIncident.impactLevel,
          location: newIncident.location,
          status: 'ACTIF'
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Accès interdit. Seuls les ADMIN et COMMISSAIRE peuvent déclarer des incidents.');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const createdIncident = await response.json();
      setIncidents([createdIncident, ...incidents]);
      setNewIncident({
        description: '',
        type: 'TECHNIQUE',
        impactLevel: 'MOYEN',
        location: '',
      });
      setShowReportForm(false);
    } catch (error) {
      console.error('Erreur lors de la création de l\'incident:', error);
      setError(error instanceof Error ? error.message : 'Impossible de créer l\'incident. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (incidentId: number, status: Incident['status']) => {
    try {
      // Trouver l'incident à mettre à jour
      const incidentToUpdate = incidents.find(incident => incident.id === incidentId);
      if (!incidentToUpdate) {
        throw new Error('Incident non trouvé');
      }

      const token = localStorage.getItem('token');
      
      // Créer l'objet complet de l'incident avec le statut mis à jour
      const updatedIncidentData = {
        ...incidentToUpdate,
        status,
        // Le backend gère les dates, on peut les laisser comme elles sont
      };

      const response = await fetch(`http://localhost:8080/api/incidents/${incidentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedIncidentData)
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Accès interdit. Seuls les ADMIN et COMMISSAIRE peuvent modifier les incidents.');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const updatedIncident = await response.json();
      setIncidents(incidents.map(incident => 
        incident.id === incidentId ? updatedIncident : incident
      ));
      
      // Mettre à jour l'incident sélectionné si ouvert
      if (selectedIncident && selectedIncident.id === incidentId) {
        setSelectedIncident(updatedIncident);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      setError(error instanceof Error ? error.message : 'Impossible de mettre à jour le statut. Veuillez réessayer.');
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'à' HH:mm", { locale: fr });
  };

  const getStatusColor = (status: Incident['status']) => {
    switch (status) {
      case 'ACTIF': return 'bg-red-100 text-red-800';
      case 'RESOLU': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (impactLevel: Incident['impactLevel']) => {
    switch (impactLevel) {
      case 'CRITIQUE': return 'bg-red-600 text-white';
      case 'ELEVE': return 'bg-orange-500 text-white';
      case 'MOYEN': return 'bg-yellow-500 text-white';
      case 'FAIBLE': return 'bg-blue-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Incident['type']) => {
    switch (type) {
      case 'SECURITE':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'TECHNIQUE':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'MEDICAL':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'METEO':
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
      case 'SECURITE': return 'Sécurité';
      case 'TECHNIQUE': return 'Technique';
      case 'MEDICAL': return 'Médical';
      case 'METEO': return 'Météo';
      case 'AUTRE': return 'Autre';
    }
  };

  const getSeverityLabel = (impactLevel: Incident['impactLevel']) => {
    switch (impactLevel) {
      case 'CRITIQUE': return 'Critique';
      case 'ELEVE': return 'Élevé';
      case 'MOYEN': return 'Moyen';
      case 'FAIBLE': return 'Faible';
    }
  };

  const getStatusLabel = (status: Incident['status']) => {
    switch (status) {
      case 'ACTIF': return 'Actif';
      case 'RESOLU': return 'Résolu';
    }
  };

  // Filtrer les incidents
  const filteredIncidents = incidents.filter(incident => {
    if (filters.status !== 'all' && incident.status !== filters.status) return false;
    if (filters.type !== 'all' && incident.type !== filters.type) return false;
    if (filters.impactLevel !== 'all' && incident.impactLevel !== filters.impactLevel) return false;
    if (searchQuery && !incident.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Vérifier les permissions basées sur le rôle
  const canReportIncident = userRole === 'ROLE_ADMIN' || userRole === 'ROLE_COMMISSAIRE';

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

      {/* Affichage des erreurs */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        </div>
      )}

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
              <option value="ACTIF">Actif</option>
              <option value="RESOLU">Résolu</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="SECURITE">Sécurité</option>
              <option value="TECHNIQUE">Technique</option>
              <option value="MEDICAL">Médical</option>
              <option value="METEO">Météo</option>
              <option value="AUTRE">Autre</option>
            </select>

            <select
              value={filters.impactLevel}
              onChange={(e) => handleFilterChange('impactLevel', e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Toutes les gravités</option>
              <option value="CRITIQUE">Critique</option>
              <option value="ELEVE">Élevé</option>
              <option value="MOYEN">Moyen</option>
              <option value="FAIBLE">Faible</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Historique des incidents ({isFetching ? '...' : filteredIncidents.length})
            </h3>
            <button
              onClick={fetchIncidents}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
              disabled={isFetching}
            >
              {isFetching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Chargement...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualiser
                </>
              )}
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {isFetching ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Chargement des incidents</h4>
              <p className="text-gray-500 max-w-sm mx-auto">
                Récupération des données depuis le serveur...
              </p>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun incident trouvé</h4>
              <p className="text-gray-500 max-w-sm mx-auto">
                {searchQuery ? 'Aucun incident ne correspond à votre recherche' : 'Aucun incident à afficher'}
              </p>
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <div key={incident.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-start mb-3">
                      <div className={`p-2 rounded-lg ${getSeverityColor(incident.impactLevel)} mr-3`}>
                        {getTypeIcon(incident.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">Incident #{incident.id}</h4>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                                {getStatusLabel(incident.status)}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {getTypeLabel(incident.type)}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(incident.impactLevel)}`}>
                                {getSeverityLabel(incident.impactLevel)}
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
                        
                        <p className="text-gray-600 mb-3">{incident.description}</p>
                        
                        <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {incident.location}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {incident.reportedBy}
                          </span>
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDateTime(incident.reportedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions for authorized users */}
                  {canReportIncident && incident.status !== 'RESOLU' && (
                    <div className="mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                        <button
                          onClick={() => handleUpdateStatus(incident.id, 'RESOLU')}
                          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Marquer résolu
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
                      <option value="SECURITE">Sécurité</option>
                      <option value="TECHNIQUE">Technique</option>
                      <option value="MEDICAL">Médical</option>
                      <option value="METEO">Météo</option>
                      <option value="AUTRE">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Niveau d'impact *
                    </label>
                    <select
                      value={newIncident.impactLevel}
                      onChange={(e) => setNewIncident({...newIncident, impactLevel: e.target.value as Incident['impactLevel']})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="FAIBLE">Faible</option>
                      <option value="MOYEN">Moyen</option>
                      <option value="ELEVE">Élevé</option>
                      <option value="CRITIQUE">Critique</option>
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
                  <h3 className="text-xl font-semibold text-gray-900">Incident #{selectedIncident.id}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedIncident.status)}`}>
                      {getStatusLabel(selectedIncident.status)}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getTypeLabel(selectedIncident.type)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(selectedIncident.impactLevel)}`}>
                      {getSeverityLabel(selectedIncident.impactLevel)}
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
                      <div>
                        <p className="text-sm text-gray-500">Déclaré par</p>
                        <p className="text-gray-900 font-medium">{selectedIncident.reportedBy}</p>
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
                        <p className="text-gray-900">{formatDateTime(selectedIncident.reportedAt)}</p>
                      </div>
                      {selectedIncident.updatedAt && (
                        <div>
                          <p className="text-sm text-gray-500">Dernière mise à jour</p>
                          <p className="text-gray-900">{formatDateTime(selectedIncident.updatedAt)}</p>
                        </div>
                      )}
                      {selectedIncident.resolvedAt && (
                        <div>
                          <p className="text-sm text-gray-500">Résolu le</p>
                          <p className="text-gray-900">{formatDateTime(selectedIncident.resolvedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {canReportIncident && selectedIncident.status !== 'RESOLU' && (
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Mettre à jour le statut</h4>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedIncident.id, 'RESOLU');
                          setShowIncidentModal(false);
                        }}
                        className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Marquer comme résolu
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