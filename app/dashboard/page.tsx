'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/api/axios';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  validated?: boolean;
  documents?: string[];
}

interface Epreuve {
  id: string;
  name: string;
  competitionId: string;
}

interface Competition {
  id: string;
  name: string;
  eventId: string;
  epreuves?: Epreuve[];
}

interface Event {
  id: string;
  name: string;
  competitions?: Competition[];
}

export default function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading, setUser } = useAuth();
  const router = useRouter();

  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [passeport, setPasseport] = useState<File | null>(null);
  const [certificat, setCertificat] = useState<File | null>(null);
  const [usersToValidate, setUsersToValidate] = useState<User[]>([]);

  // ===== ADMIN – GESTION DES ÉVÉNEMENTS =====
  const [events, setEvents] = useState<Event[]>([]);
  const [newEventName, setNewEventName] = useState('');
  
  // Pour créer une compétition : on choisit d'abord l'événement
  const [newCompetitionName, setNewCompetitionName] = useState('');
  const [selectedEventForCompetition, setSelectedEventForCompetition] = useState<string>('');
  
  // Pour créer une épreuve : on choisit d'abord la compétition
  const [newEpreuveName, setNewEpreuveName] = useState('');
  const [selectedCompetitionForEpreuve, setSelectedCompetitionForEpreuve] = useState<string>('');
  
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreatingCompetition, setIsCreatingCompetition] = useState(false);
  const [isCreatingEpreuve, setIsCreatingEpreuve] = useState(false);

  // Fetch des événements avec leurs compétitions et épreuves
  const fetchEvents = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await axiosInstance.get('/admin/events', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = res.data;
      
      // Normalisation de la réponse
      if (Array.isArray(data)) {
        setEvents(data);
      } else if (data && Array.isArray(data.data)) {
        setEvents(data.data);
      } else {
        setEvents([]);
      }
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setMessage('Accès refusé (403) pour récupérer les événements. Vérifiez vos permissions.');
      }
      setEvents([]);
    }
  };

  // Vérifier si l'utilisateur a les droits admin
  const checkAdminPermissions = (): boolean => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const decoded: any = jwtDecode(token);
      const roles = decoded?.roles || decoded?.authorities || decoded?.role || decoded?.scope;
      
      if (!roles) return false;
      
      // Si roles est un tableau
      if (Array.isArray(roles)) {
        return roles.some((role: string) => 
          role.includes('ADMIN') || 
          role.includes('ROLE_ADMIN') ||
          role === 'admin'
        );
      }
      
      // Si roles est une chaîne
      const rolesString = String(roles).toUpperCase();
      return rolesString.includes('ADMIN') || rolesString.includes('ROLE_ADMIN');
      
    } catch (e) {
      return false;
    }
  };

  // Créer un événement
  const createEvent = async () => {
    if (!newEventName.trim()) {
      setMessage("Veuillez saisir un nom d'événement.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage("Vous devez être connecté.");
      return;
    }

    setIsCreatingEvent(true);
    setMessage("Création de l'événement...");

    try {
      const isAdmin = checkAdminPermissions();
      if (!isAdmin) {
        setMessage("Accès refusé: droits administrateur requis.");
        return;
      }

      const res = await axiosInstance.post('/admin/events', 
        { name: newEventName }, 
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (res?.data) {
        setEvents(prev => [res.data, ...prev]);
      } else {
        await fetchEvents();
      }

      setNewEventName('');
      setMessage('Événement créé ✅');
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setMessage('Accès refusé (403) — droits insuffisants.');
      } else {
        setMessage("Erreur lors de la création de l'événement.");
      }
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Créer une compétition dans un événement spécifique
  const createCompetition = async () => {
    if (!newCompetitionName.trim() || !selectedEventForCompetition) {
      setMessage("Veuillez saisir un nom de compétition ET sélectionner un événement.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage("Vous devez être connecté.");
      return;
    }

    setIsCreatingCompetition(true);
    setMessage("Création de la compétition...");

    try {
      const isAdmin = checkAdminPermissions();
      if (!isAdmin) {
        setMessage("Accès refusé: droits administrateur requis.");
        return;
      }

      const res = await axiosInstance.post(
        `/admin/events/${selectedEventForCompetition}/competitions`,
        { name: newCompetitionName },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (res?.data) {
        const createdCompetition = res.data;
        
        setEvents(prev => prev.map(event => {
          if (event.id !== selectedEventForCompetition) return event;
          
          const completeCompetition = {
            id: createdCompetition.id || `temp-${Date.now()}`,
            name: createdCompetition.name || newCompetitionName,
            eventId: selectedEventForCompetition,
            epreuves: []
          };
          
          const updatedCompetitions = event.competitions 
            ? [...event.competitions, completeCompetition]
            : [completeCompetition];
            
          return {
            ...event,
            competitions: updatedCompetitions
          };
        }));
      } else {
        await fetchEvents();
      }

      setNewCompetitionName('');
      setSelectedEventForCompetition('');
      setMessage('Compétition créée ✅');
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setMessage('Accès refusé (403) — droits insuffisants.');
      } else if (err?.response?.status === 404) {
        setMessage('Événement non trouvé.');
      } else {
        setMessage('Erreur lors de la création de la compétition.');
      }
    } finally {
      setIsCreatingCompetition(false);
    }
  };

  // Créer une épreuve
  const createEpreuve = async () => {
    if (!newEpreuveName.trim() || !selectedCompetitionForEpreuve) {
      setMessage("Veuillez saisir un nom d'épreuve ET sélectionner une compétition.");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage("Vous devez être connecté.");
      return;
    }

    setIsCreatingEpreuve(true);
    setMessage("Création de l'épreuve...");

    try {
      const isAdmin = checkAdminPermissions();
      if (!isAdmin) {
        setMessage("Accès refusé: droits administrateur requis.");
        return;
      }

      const res = await axiosInstance.post(
        `/admin/events/competitions/${selectedCompetitionForEpreuve}/epreuves`,
        { name: newEpreuveName },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      if (res?.data) {
        const createdEpreuve = res.data;
        
        setEvents(prev => prev.map(event => ({
          ...event,
          competitions: event.competitions?.map(competition => {
            if (competition.id !== selectedCompetitionForEpreuve) return competition;
            
            const completeEpreuve = {
              id: createdEpreuve.id || `temp-epreuve-${Date.now()}`,
              name: createdEpreuve.name || newEpreuveName,
              competitionId: selectedCompetitionForEpreuve
            };
            
            const updatedEpreuves = competition.epreuves
              ? [...competition.epreuves, completeEpreuve]
              : [completeEpreuve];
              
            return {
              ...competition,
              epreuves: updatedEpreuves
            };
          })
        })));
      } else {
        await fetchEvents();
      }

      setNewEpreuveName('');
      setSelectedCompetitionForEpreuve('');
      setMessage('Épreuve créée ✅');
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setMessage('Accès refusé (403).');
      } else if (err?.response?.status === 404) {
        setMessage('Endpoint non trouvé (404).');
      } else {
        setMessage("Erreur lors de la création de l'épreuve.");
      }
    } finally {
      setIsCreatingEpreuve(false);
    }
  };

  // Charger les données
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchEvents();
      fetchUsersToValidate();
    }

    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && user.validated === false) {
        router.push('/pending-validation');
      }
    }

    if (user) {
      setUsernameInput(user.username);
      setEmailInput(user.email);
    }
  }, [isAuthenticated, isLoading, router, user]);

  // Fetch users waiting validation (admin)
  const fetchUsersToValidate = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axiosInstance.get('/admin/pending-users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsersToValidate(res.data);
    } catch (err) {
      console.error('Erreur fetchUsersToValidate:', err);
    }
  };

  // Validate a user (admin)
  const validateUser = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      await axiosInstance.put(`/admin/validate/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsersToValidate(prev => prev.filter(u => u.id !== id));
      setMessage(`Utilisateur ${id} validé ✅`);
    } catch (err) {
      setMessage('Erreur lors de la validation.');
    }
  };

  // Update profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Vous devez être connecté.');
        return;
      }
      const response = await axiosInstance.put(
        '/user/update-profile',
        { username: usernameInput, email: emailInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser({ ...user, username: response.data.username, email: response.data.email });
      setMessage('Profil mis à jour avec succès ✅');
    } catch (err: any) {
      setMessage('Erreur lors de la mise à jour du profil.');
    }
  };

  // Upload documents (ATHLETE)
  const handleSubmitDocuments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passeport || !certificat) {
      setMessage('Veuillez sélectionner tous les documents.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('passeport', passeport);
      formData.append('certificat', certificat);
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Vous devez être connecté.');
        return;
      }
      const response = await axiosInstance.post('/user/upload-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setUser({ ...user, documents: response.data.documents, validated: response.data.validated });
      setMessage('Documents uploadés avec succès ✅');
      setPasseport(null);
      setCertificat(null);
    } catch (err: any) {
      setMessage('Erreur lors de l\'envoi des documents.');
    }
  };

  // Delete document (ATHLETE)
  const handleDeleteDocument = async (doc: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axiosInstance.delete('/user/delete-document', {
        headers: { Authorization: `Bearer ${token}` },
        data: { document: doc },
      });
      setUser({ ...user, documents: response.data.documents });
      setMessage(`Document "${doc}" supprimé ✅`);
      if (selectedDoc?.includes(doc)) setSelectedDoc(null);
    } catch (err: any) {
      setMessage('Erreur lors de la suppression du document.');
    }
  };

  // Preview document (ATHLETE)
  const handlePreviewDocument = (fileName: string) => {
    setSelectedDoc(`http://localhost:8080/api/user/documents/${user.id}/${encodeURIComponent(fileName)}`);
  };

  // Récupérer toutes les compétitions pour le dropdown
  const getAllCompetitions = () => {
    const competitions = events.flatMap(event => 
      event.competitions?.map(competition => ({
        ...competition,
        eventName: event.name,
        id: competition.id || '',
        name: competition.name || 'Compétition sans nom'
      })) || []
    );
    
    return competitions.filter(comp => comp.id);
  };

  // Get selected event name for display
  const getSelectedEventName = () => {
    if (!selectedEventForCompetition) return '';
    const event = events.find(e => e.id === selectedEventForCompetition);
    return event ? event.name : 'Événement non trouvé';
  };

  // Get selected competition name for display
  const getSelectedCompetitionName = () => {
    if (!selectedCompetitionForEpreuve) return '';
    const competition = getAllCompetitions().find(c => c.id === selectedCompetitionForEpreuve);
    return competition ? competition.name : 'Compétition non trouvée';
  };

  if (isLoading) return <div style={{ padding: '2rem' }}>Chargement...</div>;
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Navbar */}
      <nav style={{ backgroundColor: 'white', padding: '1rem 2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>CiblOrgaSport</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={logout} style={{ backgroundColor: '#dc2626', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none' }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={{ padding: '2rem' }}>
        {/* Profil */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Bienvenue, {user.username} !</h2>
          <div style={{ color: '#6b7280' }}>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Rôle:</strong> {user.role}</p>
            <p><strong>Validé:</strong> {user.validated ? 'Oui' : 'Non'}</p>
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {/* Profil résumé & mise à jour */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Mon Profil</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Gérer vos informations personnelles</p>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <input 
                type="text" 
                value={usernameInput} 
                onChange={e => setUsernameInput(e.target.value)} 
                placeholder="Nom d'utilisateur" 
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              />
              <input 
                type="email" 
                value={emailInput} 
                onChange={e => setEmailInput(e.target.value)} 
                placeholder="Email" 
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
              />
              <button 
                type="submit" 
                style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
              >
                Mettre à jour
              </button>
            </form>
            {message && <p style={{ marginTop: '0.5rem', color: message.includes('Erreur') ? '#dc2626' : '#16a34a', whiteSpace: 'pre-wrap' }}>{message}</p>}
          </div>

          {/* Documents (ATHLETE) */}
          {user.role === 'ATHLETE' && (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Documents</h3>
              <form onSubmit={handleSubmitDocuments} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  onChange={e => setPasseport(e.target.files?.[0] ?? null)} 
                  style={{ padding: '0.25rem' }}
                />
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg" 
                  onChange={e => setCertificat(e.target.files?.[0] ?? null)} 
                  style={{ padding: '0.25rem' }}
                />
                <button 
                  type="submit" 
                  style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
                >
                  Envoyer
                </button>
              </form>
              {(user.documents ?? []).length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {(user.documents ?? []).map((doc, idx) => {
                    const fileName = doc.split(': ')[1] || doc;
                    return (
                      <li key={idx} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button 
                          onClick={() => handlePreviewDocument(fileName)} 
                          style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                        >
                          {fileName}
                        </button>
                        <button 
                          onClick={() => handleDeleteDocument(doc)} 
                          style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          Supprimer
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Aucun document uploadé.</p>
              )}
              {selectedDoc && (
                <div style={{ marginTop: '1rem' }}>
                  <button 
                    onClick={() => setSelectedDoc(null)} 
                    style={{ marginBottom: '0.5rem', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '0.25rem', border: '1px solid #ccc' }}
                  >
                    Fermer l'aperçu
                  </button>
                  {selectedDoc.endsWith('.pdf') ? (
                    <iframe 
                      src={selectedDoc} 
                      width="100%" 
                      height="400px" 
                      style={{ border: '1px solid #ccc', borderRadius: '0.25rem' }} 
                    />
                  ) : (
                    <img 
                      src={selectedDoc} 
                      alt="Document" 
                      style={{ maxWidth: '100%', border: '1px solid #ccc', borderRadius: '0.25rem' }} 
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Validation comptes (ADMIN) */}
          {user.role === 'ADMIN' && (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Validation des comptes</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Valider les comptes VOLONTAIRE et COMMISSAIRE</p>
              {usersToValidate.length === 0 ? (
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Aucun compte en attente</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {usersToValidate.map(u => (
                    <li key={u.id} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {u.username} ({u.role})
                      <button 
                        onClick={() => validateUser(u.id)} 
                        style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}
                      >
                        Valider
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ===== ADMIN : GESTION DES ÉVÉNEMENTS, COMPÉTITIONS ET ÉPREUVES ===== */}
        {user?.role === 'ADMIN' && (
          <div style={{ marginTop: '2rem', background: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Gestion des événements</h3>

            {/* Section 1 : Créer un événement */}
            <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>1. Créer un nouvel événement</h4>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Nom de l'événement"
                  value={newEventName}
                  onChange={e => setNewEventName(e.target.value)}
                  style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', flex: 1 }}
                />
                <button 
                  onClick={createEvent} 
                  disabled={isCreatingEvent || !checkAdminPermissions()}
                  style={{ 
                    backgroundColor: checkAdminPermissions() ? '#2563eb' : '#9ca3af',
                    color: 'white', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '0.25rem', 
                    border: 'none',
                    cursor: (isCreatingEvent || !checkAdminPermissions()) ? 'not-allowed' : 'pointer',
                    opacity: isCreatingEvent ? 0.7 : 1
                  }}
                >
                  {isCreatingEvent ? 'Création...' : 'Créer Événement'}
                </button>
              </div>
              {!checkAdminPermissions() && (
                <p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  ⚠️ Vous n'avez pas les permissions administrateur dans votre token.
                </p>
              )}
            </div>

            {/* Section 2 : Créer une compétition */}
            <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>2. Créer une compétition dans un événement</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={selectedEventForCompetition}
                    onChange={(e) => setSelectedEventForCompetition(e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', flex: 1 }}
                  >
                    <option value="">-- Sélectionner un événement --</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id}>
                        {event.name} (ID: {event.id})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Nom de la compétition"
                    value={newCompetitionName}
                    onChange={e => setNewCompetitionName(e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={createCompetition}
                    disabled={isCreatingCompetition || !selectedEventForCompetition || !newCompetitionName.trim() || !checkAdminPermissions()}
                    style={{ 
                      backgroundColor: (selectedEventForCompetition && newCompetitionName.trim() && checkAdminPermissions()) ? '#16a34a' : '#9ca3af',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      cursor: (isCreatingCompetition || !selectedEventForCompetition || !newCompetitionName.trim() || !checkAdminPermissions()) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isCreatingCompetition ? 'Création...' : 'Créer Compétition'}
                  </button>
                  {selectedEventForCompetition && (
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                      Événement sélectionné: {getSelectedEventName()}
                    </span>
                  )}
                </div>
                {!selectedEventForCompetition && (
                  <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                    ⚠️ Veuillez sélectionner un événement valide.
                  </p>
                )}
              </div>
            </div>

            {/* Section 3 : Créer une épreuve */}
            <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '0.75rem' }}>3. Créer une épreuve dans une compétition</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={selectedCompetitionForEpreuve}
                    onChange={(e) => setSelectedCompetitionForEpreuve(e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', flex: 1 }}
                  >
                    <option value="">-- Sélectionner une compétition --</option>
                    {getAllCompetitions().map(competition => (
                      <option key={competition.id} value={competition.id}>
                        {competition.eventName} → {competition.name} (ID: {competition.id})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Nom de l'épreuve"
                    value={newEpreuveName}
                    onChange={e => setNewEpreuveName(e.target.value)}
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', flex: 1 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={createEpreuve}
                    disabled={isCreatingEpreuve || !selectedCompetitionForEpreuve || !newEpreuveName.trim() || !checkAdminPermissions()}
                    style={{ 
                      backgroundColor: (selectedCompetitionForEpreuve && newEpreuveName.trim() && checkAdminPermissions()) ? '#7c3aed' : '#9ca3af',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.25rem',
                      border: 'none',
                      cursor: (isCreatingEpreuve || !selectedCompetitionForEpreuve || !newEpreuveName.trim() || !checkAdminPermissions()) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isCreatingEpreuve ? 'Création...' : 'Créer Épreuve'}
                  </button>
                  {selectedCompetitionForEpreuve && (
                    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                      Compétition sélectionnée: {getSelectedCompetitionName()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4 : Liste des événements existants */}
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Événements existants</h4>
              {events.length === 0 ? (
                <p style={{ color: '#6b7280' }}>Aucun événement créé pour le moment.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {events.map(event => (
                    <div key={event.id} style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>
                          📅 {event.name} (ID: {event.id})
                        </span>
                      </div>
                      
                      {/* Compétitions de cet événement */}
                      {event.competitions && event.competitions.length > 0 ? (
                        <div style={{ marginLeft: '1rem' }}>
                          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Compétitions :</p>
                          {event.competitions.map(competition => (
                            <div key={competition.id} style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontWeight: '600', color: '#374151' }}>
                                  🏆 {competition.name} (ID: {competition.id})
                                </span>
                              </div>
                              
                              {/* Épreuves de cette compétition */}
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
                                <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginLeft: '1rem' }}>
                                  Aucune épreuve créée pour cette compétition.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginLeft: '1rem' }}>
                          Aucune compétition créée pour cet événement.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}