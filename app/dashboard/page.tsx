'use client';

import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import ProfileSection from './components/ProfileSection';
import DocumentsSection from './components/DocumentsSection';
import ValidationSection from './components/ValidationSection';
import EventsManagement from './components/EventsManagement';

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
 
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user && (user as any).validated === false) {
        router.push('/pending-validation');
      }
    }
  }, [isAuthenticated, isLoading, router, user]);

  if (isLoading) return <div style={{ padding: '2rem' }}>Chargement...</div>;
  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>

      <Navbar onLogout={logout} username={user.username} />

      <div style={{ padding: '2rem' }}>

        <ProfileSection user={user} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>

          {user.role === 'ATHLETE' && (
            <DocumentsSection user={user} />
          )} 

          {user.role === 'ADMIN' && (
            <ValidationSection />
          )} 
        </div>

        {user?.role === 'ADMIN' && (
          <EventsManagement user={user} />
        )}

        <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
  <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Compétitions</h3>
  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
    Consultez la liste des compétitions disponibles
  </p>
  <button 
    onClick={() => router.push('/competitions')}
    style={{ 
      backgroundColor: '#3b82f6', 
      color: 'white', 
      padding: '0.75rem 1.5rem', 
      borderRadius: '0.375rem', 
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      fontSize: '1rem',
      fontWeight: '500'
    }}
  >
    Voir les compétitions
  </button>
</div>

<div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
  <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Mes abonnements</h3>
  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
    Consultez les compétitions auxquelles vous êtes abonné
  </p>
  <button 
    onClick={() => router.push('/abonnements')}
    style={{ 
      backgroundColor: '#10b981', 
      color: 'white', 
      padding: '0.75rem 1.5rem', 
      borderRadius: '0.375rem', 
      border: 'none',
      cursor: 'pointer',
      width: '100%',
      fontSize: '1rem',
      fontWeight: '500'
    }}
  >
    Voir mes abonnements
  </button>
</div>
      </div>
      
    </div>
  );
}