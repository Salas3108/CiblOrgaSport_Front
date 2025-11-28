'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Chargement...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <nav style={{ 
        backgroundColor: 'white', 
        padding: '1rem 2rem', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>CiblOrgaSport</h1>
        <button
          onClick={logout}
          style={{ 
            backgroundColor: '#dc2626', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            borderRadius: '0.25rem',
            border: 'none'
          }}
        >
          Déconnexion
        </button>
      </nav>

      <div style={{ padding: '2rem' }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Bienvenue, {user.username} !
          </h2>
          <div style={{ color: '#6b7280' }}>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Rôle:</strong> {user.role}</p>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Mon Profil</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Gérer vos informations personnelles
            </p>
          </div>

          {user.role === 'ATHLETE' && (
            <div style={{ 
              backgroundColor: 'white', 
              padding: '1.5rem', 
              borderRadius: '0.5rem', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
            }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Documents</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Télécharger vos documents obligatoires
              </p>
            </div>
          )}

          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Événements</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              Voir les événements à venir
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}