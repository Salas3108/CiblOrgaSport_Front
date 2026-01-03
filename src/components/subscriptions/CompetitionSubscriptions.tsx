'use client';
import React, { useState, useEffect } from 'react';
import { subscribeToCompetition, unsubscribeFromCompetition, getUserSubscriptions } from '@/src/api/abonnementService';
import { listCompetitions } from '@/src/api/eventService';

interface Competition {
  id: string;
  name: string;
  date: string;
  type: string;
  isSubscribed?: boolean;
}

export default function CompetitionSubscriptions() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('1'); // Get from auth context

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [competitionsData, subscriptionsData] = await Promise.all([
        listCompetitions(),
        getUserSubscriptions(userId)
      ]);
      
      const subscribedIds = subscriptionsData.map((sub: any) => sub.competitionId);
      const competitionsWithSub = competitionsData.map((comp: any) => ({
        ...comp,
        isSubscribed: subscribedIds.includes(comp.id)
      }));
      
      setCompetitions(competitionsWithSub);
      setSubscriptions(subscribedIds);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (competitionId: string) => {
    try {
      await subscribeToCompetition(userId, competitionId);
      setCompetitions(prev => prev.map(comp => 
        comp.id === competitionId ? { ...comp, isSubscribed: true } : comp
      ));
      setSubscriptions(prev => [...prev, competitionId]);
    } catch (error) {
      console.error('Failed to subscribe:', error);
    }
  };

  const handleUnsubscribe = async (competitionId: string) => {
    try {
      await unsubscribeFromCompetition(userId, competitionId);
      setCompetitions(prev => prev.map(comp => 
        comp.id === competitionId ? { ...comp, isSubscribed: false } : comp
      ));
      setSubscriptions(prev => prev.filter(id => id !== competitionId));
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Abonnements aux Compétitions</h2>
      
      <div className="grid gap-4">
        {competitions.map((competition) => (
          <div key={competition.id} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{competition.name}</h3>
              <p className="text-sm text-gray-600">{competition.type} - {competition.date}</p>
            </div>
            
            <button
              onClick={() => competition.isSubscribed 
                ? handleUnsubscribe(competition.id)
                : handleSubscribe(competition.id)
              }
              className={`px-4 py-2 rounded ${
                competition.isSubscribed
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {competition.isSubscribed ? 'Se désabonner' : "S'abonner"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
