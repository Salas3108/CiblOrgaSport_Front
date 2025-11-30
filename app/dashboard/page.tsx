'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/api/axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  validated?: boolean;
  documents?: string[];
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

  // Load user info and admin pending users
  useEffect(() => {
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

      if (user.role === 'ADMIN') {
        fetchUsersToValidate();
      }
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
      console.error('Erreur validateUser:', err);
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
      console.error('Erreur update-profile:', err.response || err.message, err);
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
      console.error('Erreur upload-documents:', err.response || err.message, err);
      setMessage('Erreur lors de l’envoi des documents.');
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
      console.error('Erreur delete-document:', err.response || err.message, err);
      setMessage('Erreur lors de la suppression du document.');
    }
  };

  // Preview document (ATHLETE)
  const handlePreviewDocument = (fileName: string) => {
    setSelectedDoc(`http://localhost:8080/api/user/documents/${user.id}/${encodeURIComponent(fileName)}`);
  };

  if (isLoading) return <div style={{ padding: '2rem' }}>Chargement...</div>;
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Navbar */}
      <nav style={{ backgroundColor: 'white', padding: '1rem 2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>CiblOrgaSport</h1>
        <button onClick={logout} style={{ backgroundColor: '#dc2626', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none' }}>
          Déconnexion
        </button>
      </nav>

      <div style={{ padding: '2rem' }}>
        {/* Profil */}
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Bienvenue, {user.username} !</h2>
          <div style={{ color: '#6b7280' }}>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Rôle:</strong> {user.role}</p>
          </div>
        </div>

        {/* Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          {/* Profil résumé & mise à jour */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Mon Profil</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Gérer vos informations personnelles</p>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              <input type="text" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} placeholder="Nom d'utilisateur" />
              <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder="Email" />
              <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>Mettre à jour</button>
            </form>
            {message && <p style={{ marginTop: '0.5rem', color: message.includes('Erreur') ? '#dc2626' : '#16a34a' }}>{message}</p>}
          </div>

          {/* Documents (ATHLETE) */}
          {user.role === 'ATHLETE' && (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Documents</h3>
              <form onSubmit={handleSubmitDocuments} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setPasseport(e.target.files?.[0] ?? null)} />
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setCertificat(e.target.files?.[0] ?? null)} />
                <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>Envoyer</button>
              </form>
              {(user.documents ?? []).length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {(user.documents ?? []).map((doc, idx) => {
                    const fileName = doc.split(': ')[1] || doc;
                    return (
                      <li key={idx} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button onClick={() => handlePreviewDocument(fileName)} style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                          {fileName}
                        </button>
                        <button onClick={() => handleDeleteDocument(doc)} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}>Supprimer</button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Aucun document uploadé.</p>
              )}
              {selectedDoc && (
                <div style={{ marginTop: '1rem' }}>
                  <button onClick={() => setSelectedDoc(null)} style={{ marginBottom: '0.5rem', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '0.25rem', border: '1px solid #ccc' }}>Fermer l’aperçu</button>
                  {selectedDoc.endsWith('.pdf') ? (
                    <iframe src={selectedDoc} width="100%" height="400px" style={{ border: '1px solid #ccc', borderRadius: '0.25rem' }} />
                  ) : (
                    <img src={selectedDoc} alt="Document" style={{ maxWidth: '100%', border: '1px solid #ccc', borderRadius: '0.25rem' }} />
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
                      <button onClick={() => validateUser(u.id)} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
                        Valider
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
