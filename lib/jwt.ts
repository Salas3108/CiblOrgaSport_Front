// src/lib/jwt.ts
// Utilitaires JWT : lecture du localStorage et décodage du token (CiblOrgaSport)

import type { JwtPayload } from '@/types/geo';

/** Récupère le token brut depuis le localStorage */
export function getTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Décode le payload du token JWT (base64url → JSON).
 * Ne vérifie PAS la signature (vérification faite côté serveur).
 */
export function getJwtPayload(): JwtPayload | null {
  const token = getTokenFromStorage();
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    // base64url → base64 standard
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Retourne l'identifiant de l'utilisateur connecté (claim userId) */
export function getUserId(): number | null {
  return getJwtPayload()?.userId ?? null;
}

/** Retourne le rôle de l'utilisateur connecté (ex: "ROLE_ADMIN") */
export function getRole(): string | null {
  return getJwtPayload()?.role ?? null;
}

/** Vérifie si l'utilisateur connecté possède le rôle donné */
export function isRole(role: string): boolean {
  return getRole() === role;
}
