// types/analytics.ts
// Types TypeScript pour le module Analytics (Metabase + Spring Boot)

export interface DailyStats {
  statDate: string
  totalConnections: number
  uniqueUsers: number
  connectionsAthletes: number
  connectionsSpectateurs: number
  connectionsCommissaires: number
  connectionsVolontaires: number
  totalNotificationsSent: number
  avgSessionDurationMs: number
}

export interface TodayStats {
  totalEvents: number
  uniqueUsers: number
  notificationsSent: number
  avgSessionMinutes: number
  comparedToYesterday: {
    connections: number   // pourcentage vs hier
    notifications: number
    users: number
  }
}

export interface MetabaseChart {
  key: string
  url: string
  title: string
  description: string
  colSpan: 1 | 2
  height: number
}

export type Period = 'today' | '7d' | '30d' | 'custom'
