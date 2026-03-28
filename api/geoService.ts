// src/api/geoService.ts
// Centralise tous les appels REST vers le geolocation-service (http://137.74.133.131)
// Toutes les requêtes transitent via le proxy Next.js /api/geo/* → localhost:8091/api/geo/*

import axios, { AxiosError } from 'axios';
import { getTokenFromStorage } from '@/lib/jwt';
import type {
  PositionResponse,
  FanZoneResponse,
  CreateFanZoneRequest,
} from '@/types/geo';

// ---------------------------------------------------------------------------
// Instance Axios dédiée au geolocation-service
// ---------------------------------------------------------------------------
const GEO_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://137.74.133.131'}/api/geo`;
const geoHttp = axios.create({ baseURL: GEO_BASE });

geoHttp.interceptors.request.use((config) => {
  const token = getTokenFromStorage();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

geoHttp.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Positions athlètes
// ---------------------------------------------------------------------------

/**
 * Publie la position d'un athlète (rôle ATHLETE, son propre ID).
 * POST /api/geo/athletes/{athleteId}/position
 */
export async function postAthletePosition(
  athleteId: number,
  lat: number,
  lng: number
): Promise<PositionResponse> {
  const { data } = await geoHttp.post<PositionResponse>(
    `/athletes/${athleteId}/position`,
    { latitude: lat, longitude: lng }
  );
  return data;
}

/**
 * Récupère la dernière position connue d'un athlète (COMMISSAIRE, ADMIN).
 * GET /api/geo/athletes/{athleteId}/position
 */
export async function getAthleteLastPosition(
  athleteId: number
): Promise<PositionResponse> {
  const { data } = await geoHttp.get<PositionResponse>(
    `/athletes/${athleteId}/position`
  );
  return data;
}

/**
 * Récupère l'historique de positions d'un athlète (COMMISSAIRE, ADMIN).
 * GET /api/geo/athletes/{athleteId}/history?dateDebut=&dateFin=
 *
 * @param dateDebut - ISO-8601 sans timezone, ex: "2026-03-07T00:00:00"
 * @param dateFin   - ISO-8601 sans timezone, ex: "2026-03-07T23:59:59"
 */
export async function getAthleteHistory(
  athleteId: number,
  dateDebut?: string,
  dateFin?: string
): Promise<PositionResponse[]> {
  const params: Record<string, string> = {};
  if (dateDebut) params.dateDebut = dateDebut;
  if (dateFin) params.dateFin = dateFin;

  const { data } = await geoHttp.get<PositionResponse[]>(
    `/athletes/${athleteId}/history`,
    { params }
  );
  return data;
}

/**
 * Supprime toutes les positions d'un athlète (ADMIN).
 * DELETE /api/geo/athletes/{athleteId}/positions
 */
export async function deleteAthletePositions(athleteId: number): Promise<void> {
  await geoHttp.delete(`/athletes/${athleteId}/positions`);
}

// ---------------------------------------------------------------------------
// Fan Zones
// ---------------------------------------------------------------------------

/**
 * Crée une nouvelle fan zone (ADMIN).
 * POST /api/geo/fanzones
 */
export async function createFanZone(
  fanZoneData: CreateFanZoneRequest
): Promise<FanZoneResponse> {
  const { data } = await geoHttp.post<FanZoneResponse>('/fanzones', fanZoneData);
  return data;
}

/**
 * Récupère toutes les fan zones (PUBLIC, sans token requis).
 * GET /api/geo/fanzones
 */
export async function getAllFanZones(): Promise<FanZoneResponse[]> {
  const { data } = await geoHttp.get<FanZoneResponse[]>('/fanzones');
  return data;
}

/**
 * Récupère les fan zones proches d'une position (PUBLIC).
 * GET /api/geo/fanzones/nearby?lat=&lng=&rayon=
 *
 * @param rayon - Rayon en mètres
 */
export async function getNearbyFanZones(
  lat: number,
  lng: number,
  rayon: number
): Promise<FanZoneResponse[]> {
  const { data } = await geoHttp.get<FanZoneResponse[]>('/fanzones/nearby', {
    params: { lat, lng, rayon },
  });
  return data;
}

/**
 * Supprime une fan zone (ADMIN).
 * DELETE /api/geo/fanzones/{fanzoneId}
 */
export async function deleteFanZone(fanzoneId: number): Promise<void> {
  await geoHttp.delete(`/fanzones/${fanzoneId}`);
}
