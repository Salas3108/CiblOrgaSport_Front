'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/api/axios';

export default function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading, setUser } = useAuth();
  const router = useRouter();

  const [passeport, setPasseport] = useState<File | null>(null);
  const [certificat, setCertificat] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <div style={{ padding: '2rem' }}>Chargement...</div>;
  if (!user) return null;

  // Upload documents
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passeport || !certificat) {
      setMessage('Veuillez sélectionner tous les documents.');
      return;
    }

    const formData = new FormData();
    formData.append('passeport', passeport);
    formData.append('certificat', certificat);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Vous devez être connecté.');
        return;
      }

      const response = await axiosInstance.post('/user/upload-documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setUser({
        ...user,
        documents: response.data.documents,
        validated: response.data.validated,
      });

      setMessage('Documents uploadés avec succès ✅');
    } catch (err: any) {
      setMessage('Erreur lors de l’envoi des documents.');
      console.error(err.response || err.message);
    }
  };

  // Delete document
  const handleDelete = async (docName: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axiosInstance.delete('/user/delete-document', {
        headers: { Authorization: `Bearer ${token}` },
        data: { document: docName },
      });

      setUser({
        ...user,
        documents: response.data.documents,
      });

      setMessage(`Document "${docName}" supprimé ✅`);
    } catch (err: any) {
      setMessage('Erreur lors de la suppression du document.');
      console.error(err.response || err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <nav style={{ backgroundColor: 'white', padding: '1rem 2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>CiblOrgaSport</h1>
        <button onClick={logout} style={{ backgroundColor: '#dc2626', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none' }}>Déconnexion</button>
      </nav>

      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Bienvenue, {user.username} !</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Rôle:</strong> {user.role}</p>
        </div>

        {user.role === 'ATHLETE' && (
          <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Vos Documents</h3>

            {user.documents && user.documents.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1rem' }}>
                {user.documents.map((doc, idx) => {
                  const fileName = doc.split(': ')[1] || doc;
                  return (
                    <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <a href={`http://localhost:8080/api/user/documents/${user.id}/${encodeURIComponent(fileName)}`} target="_blank" rel="noopener noreferrer">
                        {fileName}
                      </a>
                      <button onClick={() => handleDelete(doc)} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}>Supprimer</button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>Aucun document uploadé.</p>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setPasseport(e.target.files?.[0] ?? null)} />
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setCertificat(e.target.files?.[0] ?? null)} />
              <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>Envoyer</button>
            </form>

            {message && <p style={{ marginTop: '0.5rem', color: message.includes('Erreur') ? '#dc2626' : '#16a34a' }}>{message}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
