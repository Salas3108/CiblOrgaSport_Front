'use client';
import React, { useState, useEffect } from 'react';
import { listTickets, createTicket, deleteTicket } from '@/src/api/ticketService';
import eventsApi from '@/src/api/eventsService';
import { authRepo } from '@/lib/services/auth-service';
import QRCode from 'react-qr-code';
import { useAuth } from '@/components/auth/auth-provider';

interface Ticket {
  id: number;
  category: string;
  basePrice: number;
  spectatorId: number;
  epreuveId: number;
  spectator?: any;
  event?: any;
}

interface Epreuve {
  id: number;
  nom: string;
  description: string;
  date?: string;
  competition?: any;
}

export default function BilletteriePage() {
  const { user } = useAuth();

  // Try to determine the spectator id from stored user or token
  const getSpectatorId = async (): Promise<number | null> => {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem('user');
      let usernameCandidate: string | undefined
      if (raw) {
        const p = JSON.parse(raw);
        const cand = p.spectatorId ?? p.spectator?.id ?? p.id ?? p.userId ?? p.sub;
        if (cand != null) {
          const n = Number(cand);
          if (!Number.isNaN(n)) return n;
          // remember username to try resolving server-side
          usernameCandidate = String(cand);
        }
        // also capture username fields
        usernameCandidate = usernameCandidate || p.username || p.name || undefined;
      }

      const token = localStorage.getItem('token');
      if (token) {
        const parts = token.split('.');
        if (parts.length >= 2) {
          try {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            const cand = payload.spectatorId ?? payload.id ?? payload.userId ?? payload.sub;
            if (cand != null) {
              const n = Number(cand);
              if (!Number.isNaN(n)) return n;
              usernameCandidate = usernameCandidate || String(cand);
            }
          } catch (e) {
            // ignore
          }
        }
      }

      // Try to fetch authenticated user's numeric id via /auth/me
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      if (storedToken) {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
          const res = await fetch(`${baseUrl}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
              'Content-Type': 'application/json'
            }
          })
          if (res.ok) {
            const data = await res.json()
            if (data.id) {
              const n = Number(data.id)
              if (!Number.isNaN(n)) return n
            }
          }
        } catch (e) {
          // ignore network errors
        }
      }
    } catch (e) {
      // ignore parsing errors
    }
    return null;
  };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [epreuves, setEpreuves] = useState<Epreuve[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-tickets' | 'register'>('my-tickets');
  const [scannerActive, setScannerActive] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formulaire d'enregistrement
  const [ticketForm, setTicketForm] = useState({
    epreuveId: '',
    category: 'standard',
    basePrice: '50'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Charger les tickets de l'utilisateur connecté
      const spectatorId = await getSpectatorId();
      const params = spectatorId ? { spectatorId } : {};
      const ticketsData = await listTickets(params as any);
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);

      // Charger les épreuves disponibles
      const epreuvesData = await eventsApi.getEpreuves();
      setEpreuves(Array.isArray(epreuvesData) ? epreuvesData : []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setErrorMessage('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const spectatorId = await getSpectatorId();
    if (!spectatorId) {
      setErrorMessage('Vous devez être connecté pour enregistrer un billet');
      return;
    }

    try {
      const payload = {
        epreuveId: parseInt(ticketForm.epreuveId),
        category: ticketForm.category,
        basePrice: parseFloat(ticketForm.basePrice),
        spectatorId
      };

      console.log('Payload envoyé:', payload);
      await createTicket(payload);
      setSuccessMessage('Billet enregistré avec succès !');
      setTicketForm({ epreuveId: '', category: 'standard', basePrice: '50' });
      loadData();
      setTimeout(() => setActiveTab('my-tickets'), 2000);
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement:', error);
      setErrorMessage(error.message || 'Erreur lors de l\'enregistrement du billet');
    }
  };

  const handleDeleteTicket = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce billet ?')) return;
    
    try {
      await deleteTicket(id);
      setSuccessMessage('Billet supprimé avec succès');
      loadData();
    } catch (error: any) {
      console.error('Erreur suppression billet:', error);
      setErrorMessage(error.message || 'Erreur lors de la suppression du billet');
    }

  };

  const handleScanQRCode = async (qrData: string) => {
    const spectatorId = await getSpectatorId();
    if (!spectatorId) {
      setErrorMessage('Vous devez être connecté pour enregistrer un billet');
      return;
    }

    try {
      // Parser les données QR (format attendu: JSON avec epreuveId, category, basePrice)
      const data = JSON.parse(qrData);
      
      const payload = {
        epreuveId: data.epreuveId,
        category: data.category || 'standard',
        basePrice: data.basePrice || 50,
        spectatorId
      };

      await createTicket(payload);
      setSuccessMessage('Billet scanné et enregistré avec succès !');
      setScannerActive(false);
      loadData();
      setTimeout(() => setActiveTab('my-tickets'), 2000);
    } catch (error: any) {
      setErrorMessage('Erreur lors du scan: ' + error.message);
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'standard': return 'Standard';
      case 'premium': return 'Premium';
      case 'vip': return 'VIP';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'standard': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'vip': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billetterie</h1>
          <p className="mt-2 text-gray-600">Gérez vos billets d'événements sportifs</p>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('my-tickets')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'my-tickets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Mes Billets ({tickets.length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'register'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Enregistrer un Billet
                </span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Mes Billets Tab */}
            {activeTab === 'my-tickets' && (
              <div>
                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun billet</h3>
                    <p className="text-gray-600 mb-6">Vous n'avez pas encore de billets enregistrés.</p>
                    <button
                      onClick={() => setActiveTab('register')}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Enregistrer un billet
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                              {getCategoryLabel(ticket.category)}
                            </span>
                            <span className="text-white font-bold text-lg">{ticket.basePrice}€</span>
                          </div>
                          <h3 className="text-white font-semibold text-lg">
                            {ticket.event?.nom || `Épreuve #${ticket.epreuveId}`}
                          </h3>
                          {ticket.event?.description && (
                            <p className="text-blue-100 text-sm mt-1">{ticket.event.description}</p>
                          )}
                        </div>

                        <div className="p-4">
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{ticket.event?.date || 'Date à confirmer'}</span>
                            </div>
                            {ticket.event?.lieu && (
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span>{ticket.event.lieu.nom}</span>
                              </div>
                            )}
                            <div className="flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                              <span>Billet #{ticket.id}</span>
                            </div>
                          </div>

                          {/* QR Code */}
                          <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                            <QRCode
                              value={JSON.stringify({ ticketId: ticket.id, epreuveId: ticket.epreuveId })}
                              size={128}
                              className="mx-auto"
                            />
                          </div>

                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="w-full px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Enregistrer un Billet Tab */}
            {activeTab === 'register' && (
              <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Formulaire d'enregistrement */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Formulaire</h3>
                        <p className="text-sm text-gray-500">Remplir manuellement</p>
                      </div>
                    </div>

                    <form onSubmit={handleRegisterTicket} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Épreuve *
                        </label>
                        <select
                          value={ticketForm.epreuveId}
                          onChange={(e) => setTicketForm({...ticketForm, epreuveId: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="">Sélectionnez une épreuve</option>
                          {epreuves.map((epreuve) => (
                            <option key={epreuve.id} value={epreuve.id}>
                              {epreuve.nom} {epreuve.date && `- ${epreuve.date}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Catégorie *
                        </label>
                        <select
                          value={ticketForm.category}
                          onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="standard">Standard</option>
                          <option value="premium">Premium</option>
                          <option value="vip">VIP</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix (€) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={ticketForm.basePrice}
                          onChange={(e) => setTicketForm({...ticketForm, basePrice: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Enregistrer le billet
                      </button>
                    </form>
                  </div>

                  {/* Scanner QR Code */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Scanner QR</h3>
                        <p className="text-sm text-gray-500">Scan rapide</p>
                      </div>
                    </div>

                    {scannerActive ? (
                      <div className="space-y-4">
                        <div className="bg-gray-100 rounded-lg p-8 text-center">
                          <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          <p className="text-gray-600 mb-4">Scanner activé</p>
                          <p className="text-sm text-gray-500">Positionnez le QR code devant la caméra</p>
                        </div>
                        <button
                          onClick={() => setScannerActive(false)}
                          className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                          <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                          <p className="text-gray-600 mb-2">Scanner un QR Code</p>
                          <p className="text-sm text-gray-500">Cliquez pour activer la caméra</p>
                        </div>
                        <button
                          onClick={() => setScannerActive(true)}
                          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Activer le scanner
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Comment enregistrer un billet ?</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Utilisez le formulaire pour saisir manuellement les informations</li>
                        <li>Ou scannez le QR code d'un billet existant</li>
                        <li>Le billet sera automatiquement associé à votre compte</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
