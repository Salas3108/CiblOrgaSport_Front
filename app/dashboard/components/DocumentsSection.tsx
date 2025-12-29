'use client';

import React, { useState } from 'react';
import axiosInstance from '@/lib/api/axios';
import { useAuth } from '@/lib/auth/authContext';

type Props = { user: any };

export default function DocumentsSection({ user }: Props) {
  const { setUser } = useAuth();
  const [passeport, setPasseport] = useState<File | null>(null);
  const [certificat, setCertificat] = useState<File | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [message, setMessage] = useState('');

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
      setUser(prev => ({ ...(prev as any), documents: response.data.documents, validated: response.data.validated }));
      setMessage('Documents uploadés avec succès ✅');
      setPasseport(null);
      setCertificat(null);
    } catch (err) {
      setMessage("Erreur lors de l'envoi des documents.");
    }
  };

  const handleDeleteDocument = async (doc: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axiosInstance.delete('/user/delete-document', {
        headers: { Authorization: `Bearer ${token}` },
        data: { document: doc },
      });
      setUser(prev => ({ ...(prev as any), documents: response.data.documents }));
      setMessage(`Document "${doc}" supprimé ✅`);
      if (selectedDoc?.includes(doc)) setSelectedDoc(null);
    } catch (err) {
      setMessage('Erreur lors de la suppression du document.');
    }
  };

  const handlePreviewDocument = (fileName: string) => {
    if (!user?.id) return;
    setSelectedDoc(`http://localhost:8080/api/user/documents/${user.id}/${encodeURIComponent(fileName)}`);
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Documents</h3>
      <form onSubmit={handleSubmitDocuments} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setPasseport(e.target.files?.[0] ?? null)} style={{ padding: '0.25rem' }} />
        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setCertificat(e.target.files?.[0] ?? null)} style={{ padding: '0.25rem' }} />
        <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>Envoyer</button>
      </form>

      {(user.documents ?? []).length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {(user.documents ?? []).map((doc: string, idx: number) => {
            const fileName = doc.split(': ')[1] || doc;
            return (
              <li key={idx} style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={() => handlePreviewDocument(fileName)} style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', padding: 0, textAlign: 'left' }}>{fileName}</button>
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
          <button onClick={() => setSelectedDoc(null)} style={{ marginBottom: '0.5rem', padding: '0.25rem 0.5rem', cursor: 'pointer', borderRadius: '0.25rem', border: '1px solid #ccc' }}>Fermer l'aperçu</button>
          {selectedDoc.endsWith('.pdf') ? (
            <iframe src={selectedDoc} width="100%" height="400px" style={{ border: '1px solid #ccc', borderRadius: '0.25rem' }} />
          ) : (
            <img src={selectedDoc} alt="Document" style={{ maxWidth: '100%', border: '1px solid #ccc', borderRadius: '0.25rem' }} />
          )}
        </div>
      )}

      {message && <p style={{ marginTop: '0.5rem', color: message.includes('Erreur') ? '#dc2626' : '#16a34a' }}>{message}</p>}
    </div>
  );
} 
