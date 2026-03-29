// src/types/geo.ts
// Définitions TypeScript pour le module de géolocalisation (CiblOrgaSport)

/** Réponse REST du backend pour une position d'athlète */
export interface PositionResponse {
  id: number;
  athleteId: number;
  latitude: number;
  longitude: number;
  /** ISO-8601 sans timezone, ex: "2026-03-07T20:27:07.579985" */
  timestamp: string;
}

/** Message reçu via WebSocket STOMP sur /topic/athletes/{athleteId} */
export interface WebSocketPositionMessage {
  athleteId: number;
  latitude: number;
  longitude: number;
  /** ISO-8601 sans timezone */
  timestamp: string;
}

/** Services disponibles dans une fan zone */
export type TypeService = 'ECRAN_GEANT' | 'RESTAURATION' | 'BOUTIQUE' | 'MEDICAL';

/** Fan zone retournée par le backend */
export interface FanZoneResponse {
  id: number;
  nom: string;
  description: string | null;
  latitude: number;
  longitude: number;
  capaciteMax: number | null;
  adresse: string | null;
  /** Tableau de services disponibles, ex: ["ECRAN_GEANT", "RESTAURATION"] */
  services: TypeService[];
  /** En mètres — rempli uniquement pour /nearby, null pour /fanzones */
  distance: number | null;
}

/** Body pour créer une fan zone (POST /api/geo/fanzones) */
export interface CreateFanZoneRequest {
  nom: string;
  description?: string;
  latitude: number;
  longitude: number;
  capaciteMax?: number;
  adresse?: string;
  services?: TypeService[];
}

/** Format d'erreur uniforme retourné par le backend */
export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}

/** Claims extraits du token JWT */
export interface JwtPayload {
  sub: string;     // username
  role: string;    // "ROLE_ATHLETE" | "ROLE_COMMISSAIRE" | "ROLE_ADMIN" | ...
  userId: number;
}
