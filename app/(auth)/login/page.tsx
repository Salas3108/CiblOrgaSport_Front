'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/authContext';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ username, password });
    } catch (err: any) {
      setError(err.response?.data || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f3f4f6' 
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '0.5rem', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
        width: '400px' 
      }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1.5rem', 
          textAlign: 'center' 
        }}>
          Connexion
        </h1>

        {error && (
          <div style={{ 
            backgroundColor: '#fee', 
            border: '1px solid #fcc', 
            color: '#c00', 
            padding: '0.75rem', 
            borderRadius: '0.25rem', 
            marginBottom: '1rem' 
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem 0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.5rem' 
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', color: '#374151', marginBottom: '0.5rem' }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '0.5rem 0.75rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '0.5rem' 
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ 
              width: '100%', 
              backgroundColor: loading ? '#9ca3af' : '#2563eb', 
              color: 'white', 
              padding: '0.5rem', 
              borderRadius: '0.5rem', 
              border: 'none',
              fontSize: '1rem'
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ marginTop: '1rem', textAlign: 'center', color: '#6b7280' }}>
          Pas encore de compte ?{' '}
          <Link href="/register" style={{ color: '#2563eb' }}>
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}