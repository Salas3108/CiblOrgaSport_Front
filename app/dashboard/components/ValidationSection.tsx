'use client';

import React, { useEffect, useState } from 'react';
import axiosInstance from '@/lib/api/axios';

type User = { id: number; username: string; role: string };

export default function ValidationSection() {
  const [usersToValidate, setUsersToValidate] = useState<User[]>([]);
  const [message, setMessage] = useState('');

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

  useEffect(() => {
    fetchUsersToValidate();
  }, []);

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

  return (
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
              <button onClick={() => validateUser(u.id)} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer' }}>Valider</button>
            </li>
          ))}
        </ul>
      )}
      {message && <p style={{ marginTop: '0.5rem', color: message.includes('Erreur') ? '#dc2626' : '#16a34a' }}>{message}</p>}
    </div>
  );
} 
