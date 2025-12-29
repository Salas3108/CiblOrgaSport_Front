'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/api/axios';
import { useAuth } from '@/lib/auth/authContext';
import { useRouter } from 'next/navigation';

interface Abonnement {
  id: string;
  userId: number;
  competition?: {
    id: string;
    name: string;
    event?: {
      id: string;
      name: string;
    };
  };
  dateAbonnement: string;
}

export default function MesAbonnementsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Rediriger si non authentifié
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Charger les abonnements
  const fetchAbonnements = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await axiosInstance.get('/mes-abonnements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Abonnements reçus:', res.data);
      
      // S'assurer que les données sont au bon format
      const formattedAbonnements = res.data.map((abonnement: any) => ({
        id: abonnement.id,
        userId: abonnement.userId,
        competition: abonnement.competition || undefined,
        dateAbonnement: abonnement.dateAbonnement
      }));
      
      setAbonnements(formattedAbonnements);
      
    } catch (err: any) {
      console.error('Erreur fetch abonnements:', err);
      
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
        setTimeout(() => router.push('/login'), 2000);
      } else if (err.response?.status === 404) {
        setError('Endpoint non trouvé. Vérifiez le backend.');
      } else {
        setError('Erreur lors du chargement de vos abonnements');
      }
    } finally {
      setLoading(false);
    }
  };

  // Se désabonner
  const handleDesabonner = async (competitionId: string, competitionName: string) => {
    try {
      setError('');
      
      const token = localStorage.getItem('token');
      const res = await axiosInstance.delete(
        `/competitions/${competitionId}/desabonner`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Recharger la liste
      fetchAbonnements();
      
      // Afficher un message temporaire
      const message = document.createElement('div');
      message.textContent = `Désabonné de "${competitionName}"`;
      message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem;
        border-radius: 0.5rem;
        z-index: 1000;
      `;
      document.body.appendChild(message);
      setTimeout(() => message.remove(), 3000);
      
    } catch (err: any) {
      console.error('Erreur désabonnement:', err);
      setError(err.response?.data?.message || 'Erreur lors du désabonnement');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAbonnements();
    }
  }, [isAuthenticated]);

  const nombreAbonnements = abonnements.length;
  const nombreEvenements = new Set(
    abonnements
      .filter(a => a.competition?.event?.id) 
      .map(a => a.competition!.event!.id) 
  ).size;

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
            ← Retour au Dashboard
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Mes abonnements</h1>
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
            Mes compétitions suivies
          </h2>
          <p style={{ color: '#6b7280' }}>
            Voici la liste des compétitions auxquelles vous êtes abonné.
          </p>
        </div>

        {/* Message d'erreur */}
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

        {/* Statistiques */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ 
            backgroundColor: '#dbeafe', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            minWidth: '200px'
          }}>
            <p style={{ fontSize: '1.125rem' }}>
              <span style={{ fontWeight: 'bold', color: '#1d4ed8' }}>{nombreAbonnements}</span> abonnements
            </p>
          </div>

        </div>

        {/* Liste des abonnements */}
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
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Chargement de vos abonnements...</p>
          </div>
        ) : abonnements.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <p style={{ color: '#6b7280', fontSize: '1.125rem', marginBottom: '1.5rem' }}>
              Vous n'êtes abonné à aucune compétition pour le moment.
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
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              Découvrir les compétitions
            </button>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {abonnements.map((abonnement) => (
              <div key={abonnement.id} style={{ 
                padding: '1rem 1.5rem', 
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '200px', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.25rem' }}>
                    {abonnement.competition?.name || 'Compétition inconnue'}
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
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Événement: {abonnement.competition?.event?.name || 'Non spécifié'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    Abonné depuis le {new Date(abonnement.dateAbonnement).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleDesabonner(
                      abonnement.competition?.id || '', 
                      abonnement.competition?.name || 'cette compétition'
                    )}
                    disabled={!abonnement.competition?.id}
                    style={{ 
                      backgroundColor: !abonnement.competition?.id ? '#f3f4f6' : '#fee2e2', 
                      color: !abonnement.competition?.id ? '#9ca3af' : '#dc2626', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '0.375rem', 
                      border: `1px solid ${!abonnement.competition?.id ? '#e5e7eb' : '#fecaca'}`,
                      cursor: !abonnement.competition?.id ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {!abonnement.competition?.id ? 'ID manquant' : 'Se désabonner'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {abonnements.length > 0 && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button 
              onClick={() => router.push('/competitions')}
              style={{ 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                padding: '0.75rem 1.5rem', 
                borderRadius: '0.375rem', 
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                marginRight: '1rem'
              }}
            >
              Voir plus de compétitions
            </button>
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