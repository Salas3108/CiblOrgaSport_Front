'use client';

import React, { useState } from 'react';
import axiosInstance from '@/lib/api/axios';
import { useAuth } from '@/lib/auth/authContext';

type Props = { user: any };

export default function ProfileSection({ user }: Props) {
  const { setUser } = useAuth();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [message, setMessage] = useState('');

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
        { username, email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(prev => ({ ...(prev as any), username: response.data.username, email: response.data.email }));
      setMessage('Profil mis à jour avec succès ✅');
    } catch (err) {
      setMessage('Erreur lors de la mise à jour du profil.');
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Bienvenue, {user.username} !</h2>
      <div style={{ color: '#6b7280' }}>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Rôle:</strong> {user.role}</p>
        <p><strong>Validé:</strong> {user.validated ? 'Oui' : 'Non'}</p>
      </div>

      <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Nom d'utilisateur"
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
        />
        <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
          Mettre à jour
        </button>
      </form>

      {message && <p style={{ marginTop: '0.5rem', color: message.includes('Erreur') ? '#dc2626' : '#16a34a', whiteSpace: 'pre-wrap' }}>{message}</p>}
    </div>
  );
} 
