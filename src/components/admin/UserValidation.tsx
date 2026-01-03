'use client';
import React, { useState, useEffect } from 'react';
import {
  adminListPendingUsers,
  adminValidateVolunteer,
  adminValidateOfficiel
} from '@/src/api/authService';

interface PendingUser {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  documents?: string[];
}

export default function UserValidation() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validatingUser, setValidatingUser] = useState<string | null>(null);

  useEffect(() => {
    loadPendingUsers();
  }, [selectedRole]);

  const loadPendingUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await adminListPendingUsers(selectedRole === 'all' ? undefined : selectedRole);
      setPendingUsers(users);
    } catch (error) {
      console.error('Failed to load pending users:', error);
      setError('Erreur lors du chargement des utilisateurs en attente');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateUser = async (user: PendingUser, validated: boolean) => {
    setValidatingUser(user.id);
    try {
      if (user.role === 'volunteer') {
        await adminValidateVolunteer({
          username: user.username,
          validated,
          accreditation: validated ? 'VALIDATED' : undefined,
          affectation: validated ? 'General' : undefined
        });
      } else if (user.role === 'official') {
        await adminValidateOfficiel({
          username: user.username,
          validated,
          accreditation: validated ? 'VALIDATED' : undefined,
          zone_responsabilite: validated ? 'Zone A' : undefined,
          type: validated ? 'Commissaire' : undefined
        });
      }
      
      loadPendingUsers();
    } catch (error) {
      console.error('Failed to validate user:', error);
      setError(`Échec de la validation de l'utilisateur ${user.username}`);
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
            <p className="text-gray-600">Chargement des utilisateurs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Validation des Comptes</h1>
            <p className="mt-2 text-gray-600">Gérez les demandes d'inscription des utilisateurs</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button
              onClick={loadPendingUsers}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Actualiser
            </button>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              {pendingUsers.length} en attente
            </span>
          </div>
        </div>
      </div>

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

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Filtrer par rôle</h3>
            <p className="text-sm text-gray-500">Afficher les utilisateurs en attente par type</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="inline-flex rounded-lg shadow-sm" role="group">
              {['all', 'volunteer', 'official', 'athlete'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`px-4 py-2 text-sm font-medium border transition-colors ${
                    selectedRole === role 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  } ${role === 'all' ? 'rounded-l-lg' : ''} ${
                    role === 'athlete' ? 'rounded-r-lg border-l-0' : 'border-l-0'
                  }`}
                >
                  {role === 'all' ? 'Tous' : 
                   role === 'volunteer' ? 'Volontaires' :
                   role === 'official' ? 'Commissaires' : 'Athlètes'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {pendingUsers.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0c-.966 0-1.75.79-1.75 1.764s.784 1.764 1.75 1.764 1.75-.79 1.75-1.764S20.466 17 19.5 17z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur en attente</h4>
            <p className="text-gray-500 max-w-sm mx-auto">
              {selectedRole === 'all' 
                ? "Tous les utilisateurs sont validés." 
                : `Aucun ${getRoleDisplay(selectedRole).toLowerCase()} en attente de validation.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingUsers.map((user) => (
              <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-blue-600">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </h4>
                            <div className="flex items-center mt-1 space-x-4">
                              <span className="inline-flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                @{user.username}
                              </span>
                              <span className="inline-flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89-4.26a2 2 0 012.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {user.email}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 sm:mt-0">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                              {getRoleDisplay(user.role)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex items-center text-sm text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Inscrit le {formatDate(user.createdAt)}
                        </div>

                        {/* Documents if any */}
                        {user.documents && user.documents.length > 0 && (
                          <div className="mt-3">
                            <span className="text-sm font-medium text-gray-700">Documents:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {user.documents.map((doc, index) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {doc}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 lg:mt-0 lg:ml-6 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                      <button
                        onClick={() => handleValidateUser(user, true)}
                        disabled={validatingUser === user.id}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {validatingUser === user.id ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Validation...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Valider
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => handleValidateUser(user, false)}
                        disabled={validatingUser === user.id}
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {validatingUser === user.id ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Rejet...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Rejeter
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {pendingUsers.length > 0 && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">À valider</p>
                <p className="text-2xl font-semibold text-gray-900">{pendingUsers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Volontaires</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {pendingUsers.filter(u => u.role === 'volunteer').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Commissaires</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {pendingUsers.filter(u => u.role === 'official').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}