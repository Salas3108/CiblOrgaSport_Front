'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/api/axios';
import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';

interface Competition {
  id: string;
  name: string;
  event: {
    id: string;
    name: string;
  };
  epreuves?: Array<{
    id: string;
    name: string;
  }>;
  estAbonne?: boolean;
  nombreAbonnes?: number;
}

export default function CompetitionsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Charger les compétitions
  const fetchCompetitions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await axiosInstance.get('/competitions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCompetitions(res.data);
      
    } catch (err: any) {
      console.error('Erreur fetch competitions:', err);
      
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError('Erreur lors du chargement des compétitions');
      }
    } finally {
      setLoading(false);
    }
  };

  // S'abonner à une compétition
  const handleSAbonner = async (competitionId: string, competitionName: string) => {
    try {
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      const res = await axiosInstance.post(
        `/competitions/${competitionId}/sabonner`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Vous êtes maintenant abonné à "${competitionName}"`);
      
      // Mettre à jour l'état local
      setCompetitions(prev => prev.map(comp => 
        comp.id === competitionId 
          ? { ...comp, estAbonne: true, nombreAbonnes: (comp.nombreAbonnes || 0) + 1 }
          : comp
      ));
      
      // Effacer le message après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: any) {
      console.error('Erreur abonnement:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'abonnement');
    }
  };

  // Se désabonner d'une compétition
  const handleDesabonner = async (competitionId: string, competitionName: string) => {
    try {
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      const res = await axiosInstance.delete(
        `/competitions/${competitionId}/desabonner`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Vous vous êtes désabonné de "${competitionName}"`);
      
      // Mettre à jour l'état local
      setCompetitions(prev => prev.map(comp => 
        comp.id === competitionId 
          ? { ...comp, estAbonne: false, nombreAbonnes: Math.max(0, (comp.nombreAbonnes || 1) - 1) }
          : comp
      ));
      
      // Effacer le message après 3 secondes
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: any) {
      console.error('Erreur désabonnement:', err);
      setError(err.response?.data?.message || 'Erreur lors du désabonnement');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompetitions();
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f3f4f6', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            border: '4px solid #f3f4f6', 
            borderTop: '4px solid #3b82f6', 
            borderRadius: '50%', 
            width: '48px', 
            height: '48px', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      {/* Navbar */}
      <nav style={{ 
        backgroundColor: 'white', 
        padding: '1rem 2rem', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => router.push('/dashboard')}
            style={{ 
              backgroundColor: 'transparent', 
              color: '#3b82f6', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.25rem', 
              border: '1px solid #3b82f6',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Compétitions</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#6b7280' }}>Bonjour, {user?.username}</span>
        </div>
      </nav>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* En-tête */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
          marginBottom: '1.5rem' 
        }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Liste des compétitions
          </h2>
          <p style={{ color: '#6b7280' }}>
            Abonnez-vous aux compétitions qui vous intéressent pour suivre leurs actualités.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1rem', 
            backgroundColor: '#fef2f2', 
            color: '#dc2626',
            borderRadius: '0.5rem',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1rem', 
            backgroundColor: '#d1fae5', 
            color: '#065f46',
            borderRadius: '0.5rem',
            border: '1px solid #a7f3d0'
          }}>
            ✅ {success}
          </div>
        )}

        {/* Statistiques */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ 
            backgroundColor: '#dbeafe', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            minWidth: '200px'
          }}>
            <p style={{ fontSize: '1.125rem' }}>
              <span style={{ fontWeight: 'bold', color: '#1d4ed8' }}>{competitions.length}</span> compétitions
            </p>
          </div>
          <div style={{ 
            backgroundColor: '#dcfce7', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            minWidth: '200px'
          }}>
            <p style={{ fontSize: '1.125rem' }}>
              <span style={{ fontWeight: 'bold', color: '#166534' }}>
                {competitions.filter(c => c.estAbonne).length}
              </span> abonnements
            </p>
          </div>
        </div>

        {/* Liste des compétitions */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ 
              border: '4px solid #f3f4f6', 
              borderTop: '4px solid #3b82f6', 
              borderRadius: '50%', 
              width: '48px', 
              height: '48px', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Chargement des compétitions...</p>
          </div>
        ) : competitions.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Aucune compétition disponible pour le moment.</p>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {competitions.map((competition) => (
              <div key={competition.id} style={{ 
                padding: '1rem 1.5rem', 
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '200px', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                    {competition.name}
                    {competition.estAbonne && (
                      <span style={{ 
                        marginLeft: '0.5rem',
                        padding: '0.1rem 0.5rem', 
                        fontSize: '0.7rem', 
                        fontWeight: '600', 
                        borderRadius: '9999px', 
                        backgroundColor: '#dcfce7', 
                        color: '#166534'
                      }}>
                        Abonné
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    {competition.event.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    {competition.epreuves?.length || 0} épreuves • 
                    {competition.nombreAbonnes || 0} abonnés
                  </div>
                </div>
                
                <div>
                  {competition.estAbonne ? (
                    <button
                      onClick={() => handleDesabonner(competition.id, competition.name)}
                      style={{ 
                        backgroundColor: '#fee2e2', 
                        color: '#dc2626', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '0.375rem', 
                        border: '1px solid #fecaca',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Se désabonner
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSAbonner(competition.id, competition.name)}
                      style={{ 
                        backgroundColor: '#3b82f6', 
                        color: 'white', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '0.375rem', 
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      S'abonner
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}