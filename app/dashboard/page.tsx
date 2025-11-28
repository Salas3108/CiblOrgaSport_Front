'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/api/axios';

export default function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading, setUser } = useAuth();
  const router = useRouter();

  const [usernameInput, setUsernameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [message, setMessage] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [passeport, setPasseport] = useState<File | null>(null);
  const [certificat, setCertificat] = useState<File | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (user) {
      setUsernameInput(user.username);
      setEmailInput(user.email);
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) return <div style={{ padding: '2rem' }}>Chargement...</div>;
  if (!user) return null;

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

  // Upload documents
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

  // Delete document
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

  // Preview document
  const handlePreviewDocument = (fileName: string) => {
    setSelectedDoc(`http://localhost:8080/api/user/documents/${user.id}/${encodeURIComponent(fileName)}`);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Navbar */}
      <nav
        style={{
          backgroundColor: 'white',
          padding: '1rem 2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>CiblOrgaSport</h1>
        <button
          onClick={logout}
          style={{ backgroundColor: '#dc2626', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none' }}
        >
          Déconnexion
        </button>
      </nav>

      <div style={{ padding: '2rem' }}>
        {/* Profil */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Bienvenue, {user.username} !
          </h2>
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
              <button
                type="submit"
                style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
              >
                Mettre à jour
              </button>
            </form>
            {message && <p style={{ marginTop: '0.5rem', color: message.includes('Erreur') ? '#dc2626' : '#16a34a' }}>{message}</p>}
          </div>

          {/* Documents */}
          {user.role === 'ATHLETE' && (
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Documents</h3>
              {/* Upload */}
              <form onSubmit={handleSubmitDocuments} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setPasseport(e.target.files?.[0] ?? null)} />
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setCertificat(e.target.files?.[0] ?? null)} />
                <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
                  Envoyer
                </button>
              </form>

              {/* Liste des documents */}
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

              {/* Aperçu */}
              {selectedDoc && (
                <div style={{ marginTop: '1rem' }}>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    style={{ marginBottom: '0.5rem', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '0.25rem', border: '1px solid #ccc' }}
                  >
                    Fermer l’aperçu
                  </button>
                  {selectedDoc.endsWith('.pdf') ? (
                    <iframe src={selectedDoc} width="100%" height="400px" style={{ border: '1px solid #ccc', borderRadius: '0.25rem' }} />
                  ) : (
                    <img src={selectedDoc} alt="Document" style={{ maxWidth: '100%', border: '1px solid #ccc', borderRadius: '0.25rem' }} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Événements */}
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Événements</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Voir les événements à venir</p>
          </div>
        </div>
      </div>
    </div>
  );
}
