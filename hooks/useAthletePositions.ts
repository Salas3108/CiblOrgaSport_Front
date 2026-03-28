// src/hooks/useAthletePositions.ts
// Hook WebSocket STOMP : suit les positions de plusieurs athlètes en temps réel.
// Une subscription distincte par athlète sur /topic/athletes/{athleteId}.

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getTokenFromStorage } from '@/lib/jwt';
import type { WebSocketPositionMessage } from '@/types/geo';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://137.74.133.131';
const GEO_WS_URL = `${API_BASE}/ws/geo`;

interface UseAthletePositionsResult {
  /** Map athleteId → dernière position reçue */
  positions: Map<number, WebSocketPositionMessage>;
  isConnected: boolean;
  error: string | null;
}

export function useAthletePositions(
  athleteIds: number[]
): UseAthletePositionsResult {
  const [positions, setPositions] = useState<Map<number, WebSocketPositionMessage>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Garde une référence stable pour éviter les re-renders inutiles
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<number, StompSubscription>>(new Map());
  // Sérialisation de la liste pour détecter les changements
  const athleteIdsKey = athleteIds.slice().sort().join(',');

  const subscribe = useCallback(
    (client: Client, ids: number[]) => {
      // Désabonnement des anciens topics
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current.clear();

      ids.forEach((athleteId) => {
        const sub = client.subscribe(
          `/topic/athletes/${athleteId}`,
          (message) => {
            try {
              const msg: WebSocketPositionMessage = JSON.parse(message.body);
              setPositions((prev) => {
                const next = new Map(prev);
                next.set(athleteId, msg);
                return next;
              });
            } catch {
              // Message malformé ignoré
            }
          }
        );
        subscriptionsRef.current.set(athleteId, sub);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (athleteIds.length === 0) return;

    const token = getTokenFromStorage();

    const client = new Client({
      // SockJS comme transport (compatible Spring Boot SockJS endpoint)
      webSocketFactory: () => new SockJS(GEO_WS_URL) as WebSocket,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        setError(null);
        subscribe(client, athleteIds);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        setError(`Erreur STOMP : ${frame.headers['message'] ?? 'inconnue'}`);
        setIsConnected(false);
      },
      onWebSocketError: () => {
        setError('Connexion WebSocket perdue. Reconnexion en cours…');
        setIsConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current.clear();
      client.deactivate();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteIdsKey]);

  // Si la connexion est déjà active et que la liste d'IDs change → re-subscribe
  useEffect(() => {
    const client = clientRef.current;
    if (client?.connected && athleteIds.length > 0) {
      subscribe(client, athleteIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [athleteIdsKey]);

  return { positions, isConnected, error };
}
