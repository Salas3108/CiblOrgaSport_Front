// api/analyticsService.ts
// Appels REST vers Spring Boot pour les statistiques temps réel.
// Ces données alimentent les StatCards (pas Metabase).

import type { DailyStats, TodayStats } from '@/types/analytics'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://137.74.133.131'

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token =
    localStorage.getItem('token') ?? localStorage.getItem('accessToken') ?? ''
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${path}`)
  return res.json() as Promise<T>
}

/** Statistiques du jour (connexions, utilisateurs, notifs, session). */
export function getTodayStats(): Promise<TodayStats> {
  return get<TodayStats>('/api/analytics/events/today')
}

/** Statistiques d'une journée précise. date = "YYYY-MM-DD" */
export function getDailyStats(date: string): Promise<DailyStats> {
  return get<DailyStats>(`/api/analytics/daily?date=${date}`)
}

/** Statistiques d'une semaine. weekStart = "YYYY-MM-DD" (lundi). */
export function getWeeklyStats(weekStart: string): Promise<DailyStats[]> {
  return get<DailyStats[]>(`/api/analytics/weekly?weekStart=${weekStart}`)
}
