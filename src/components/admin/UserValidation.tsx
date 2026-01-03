'use client';
import React, { useState, useEffect } from 'react';
import { fetchAthletes, adminValidateAthlete } from '@/src/api/authService';

interface Athlete {
  id: number;
  username: string;
  email: string;
  role: string;
  validated: boolean;
  [key: string]: any;
}


function UserValidation() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [validatedFilter, setValidatedFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validatingUser, setValidatingUser] = useState<number | null>(null);

  useEffect(() => {
    loadAthletes();
  }, [validatedFilter]);

  const loadAthletes = async () => {
    setLoading(true);
    // Ne pas effacer le message d'erreur ou de succès ici
    try {
      let validatedParam: boolean | undefined = undefined;
      if (validatedFilter === 'true') validatedParam = true;
      if (validatedFilter === 'false') validatedParam = false;
      const users = await fetchAthletes(validatedParam);
      setAthletes(users);
    } catch (error) {
      setError('Erreur lors du chargement des athlètes');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAthlete = async (athlete: Athlete, validated: boolean) => {
    setValidatingUser(athlete.id);
    setError(null);
    try {
      const response = await adminValidateAthlete({ username: athlete.username, validated });
      console.log('Réponse validation:', response);
      // Si l'API retourne explicitement une erreur métier dans le corps
      if (response && (response.error || response.status === 'error')) {
        setError(response.message || response.error || `Échec de la validation de l'athlète ${athlete.username}`);
        setTimeout(() => setError(null), 3500);
      } else {
        setSuccess(`Validation de l'athlète ${athlete.username} réussie.`);
        await loadAthletes();
        setTimeout(() => setSuccess(null), 2500);
      }
    } catch (error: any) {
      // Si l'erreur est un objet avec un message
      setError(error?.message || `Échec de la validation de l'athlète ${athlete.username}`);
      setTimeout(() => setError(null), 3500);
    } finally {
      setValidatingUser(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleDisplay = (role: string) => {
    switch(role) {
      case 'volunteer': return 'Volontaire';
      case 'official': return 'Commissaire';
      case 'athlete': return 'Athlète';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'volunteer': return 'bg-green-100 text-green-800';
      case 'official': return 'bg-blue-100 text-blue-800';
      case 'athlete': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Chargement des athlètes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Athlètes</h1>
            <p className="mt-2 text-gray-600">Liste et validation des athlètes</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button
              onClick={loadAthletes}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Actualiser
            </button>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              {athletes.length} athlètes
            </span>
          </div>
        </div>
      </div>


      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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

      {/* Filtre de validation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Filtrer par validation</h3>
            <p className="text-sm text-gray-500">Afficher les athlètes validés ou non</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="inline-flex rounded-lg shadow-sm" role="group">
              {['all', 'true', 'false'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setValidatedFilter(val)}
                  className={`px-4 py-2 text-sm font-medium border transition-colors ${
                    validatedFilter === val 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } ${val === 'all' ? 'rounded-l-lg' : ''} ${
                    val === 'false' ? 'rounded-r-lg border-l-0' : 'border-l-0'
                  }`}
                >
                  {val === 'all' ? 'Tous' : val === 'true' ? 'Validés' : 'Non validés'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des athlètes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {athletes.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.966 0-1.75.79-1.75 1.764s.784 1.764 1.75 1.764 1.75-.79 1.75-1.764S20.466 17 19.5 17z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun athlète trouvé</h4>
            <p className="text-gray-500 max-w-sm mx-auto">
              {validatedFilter === 'all' 
                ? "Aucun athlète disponible." 
                : `Aucun athlète ${validatedFilter === 'true' ? 'validé' : 'non validé'}.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {athletes.map((athlete) => (
              <div key={athlete.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{athlete.username}</h4>
                  <div className="text-sm text-gray-600">{athlete.email}</div>
                  <div className="text-xs text-gray-500">ID: {athlete.id}</div>
                  <div className="text-xs text-gray-500">Validé : {athlete.validated ? 'Oui' : 'Non'}</div>
                </div>
                <div className="mt-4 sm:mt-0 flex gap-2">
                  {!athlete.validated && (
                    <button
                      onClick={() => handleValidateAthlete(athlete, true)}
                      disabled={validatingUser === athlete.id}
                      className="inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {validatingUser === athlete.id ? 'Validation...' : 'Valider'}
                    </button>
                  )}
                  {athlete.validated && (
                    <button
                      onClick={() => handleValidateAthlete(athlete, false)}
                      disabled={validatingUser === athlete.id}
                      className="inline-flex items-center justify-center px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {validatingUser === athlete.id ? 'Rejet...' : 'Rejeter'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserValidation;