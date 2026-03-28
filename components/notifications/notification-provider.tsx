"use client"

import type React from "react"

import { Client, type StompSubscription } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { createContext, useContext, useEffect, useRef, useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { getTokenFromStorage, getUserId } from "@/lib/jwt"
import {
  type BackendNotificationDTO,
  deleteNotificationById,
  getSpectatorNotifications,
  markAllSpectatorNotificationsAsRead,
  markNotificationAsRead,
} from "@/src/api/notificationsService"

export interface Notification {
  id: string
  type: "result" | "security" | "event" | "system" | "personal"
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: "low" | "medium" | "high" | "urgent"
  category?: string
  actionUrl?: string
  backendType?: string
  idEvent?: number | null
  idSpectateur?: number | null
  sourceEventId?: string | null
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  preferences: NotificationPreferences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void
}

export interface NotificationPreferences {
  results: boolean
  security: boolean
  events: boolean
  personal: boolean
  system: boolean
  sound: boolean
  desktop: boolean
}

const defaultPreferences: NotificationPreferences = {
  results: true,
  security: true,
  events: true,
  personal: true,
  system: false,
  sound: true,
  desktop: true,
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)
const NOTIFICATIONS_WS_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL || "http://137.74.133.131/ws"
const MAX_NOTIFICATIONS = 200

const notificationTypeToPreferenceKey: Record<Notification["type"], keyof NotificationPreferences> = {
  result: "results",
  security: "security",
  event: "events",
  system: "system",
  personal: "personal",
}

const typeTitleMap: Record<Notification["type"], string> = {
  result: "Result update",
  security: "Security alert",
  event: "Event update",
  system: "System message",
  personal: "Notification",
}

const typePriorityMap: Record<Notification["type"], Notification["priority"]> = {
  result: "medium",
  security: "high",
  event: "medium",
  system: "low",
  personal: "medium",
}

function toNotificationType(rawType: string): Notification["type"] {
  const normalized = rawType.toUpperCase()

  if (normalized.includes("INCIDENT") || normalized.includes("SECUR") || normalized.includes("ALERT")) {
    return "security"
  }

  if (normalized.includes("RESULT") || normalized.includes("CLASSEMENT") || normalized.includes("MEDAILLE")) {
    return "result"
  }

  if (normalized.includes("EVENT") || normalized.includes("EPREUVE") || normalized.includes("COMPET")) {
    return "event"
  }

  if (normalized.includes("SYSTEM") || normalized.includes("MAINTENANCE")) {
    return "system"
  }

  return "personal"
}

function toNotificationPriority(rawType: string, content: string): Notification["priority"] {
  const normalized = `${rawType} ${content}`.toUpperCase()

  if (
    normalized.includes("CRITIQUE") ||
    normalized.includes("CRITICAL") ||
    normalized.includes("URGENT") ||
    normalized.includes("EMERGENCY")
  ) {
    return "urgent"
  }

  if (
    normalized.includes("HIGH") ||
    normalized.includes("SEVERE") ||
    normalized.includes("ALERT") ||
    normalized.includes("INCIDENT")
  ) {
    return "high"
  }

  if (normalized.includes("LOW")) {
    return "low"
  }

  return "medium"
}

function resolveSpectatorId(): number | null {
  const fromToken = getUserId()
  if (typeof fromToken === "number" && Number.isFinite(fromToken)) {
    return fromToken
  }

  if (typeof window === "undefined") {
    return null
  }

  const rawUser = localStorage.getItem("user")
  if (!rawUser) {
    return null
  }

  try {
    const parsed = JSON.parse(rawUser)
    const candidate = parsed?.id ?? parsed?.idSpectateur ?? parsed?.spectatorId ?? parsed?.userId
    const asNumber = Number(candidate)
    return Number.isFinite(asNumber) ? asNumber : null
  } catch {
    return null
  }
}

function mapBackendNotification(dto: BackendNotificationDTO): Notification {
  const type = toNotificationType(dto.type)
  const timestamp = new Date(dto.dateEnvoi)

  return {
    id: `server-${dto.id}`,
    type,
    title: typeTitleMap[type],
    message: dto.contenu,
    timestamp: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
    read: dto.lu,
    priority: toNotificationPriority(dto.type, dto.contenu) || typePriorityMap[type],
    backendType: dto.type,
    idEvent: dto.idEvent,
    idSpectateur: dto.idSpectateur,
    sourceEventId: dto.sourceEventId,
  }
}

function extractServerId(id: string): number | null {
  const match = id.match(/^server-(\d+)$/)
  if (!match) {
    return null
  }

  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

function sortNotifications(items: Notification[]): Notification[] {
  return [...items].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, MAX_NOTIFICATIONS)
}

function upsertNotification(items: Notification[], next: Notification): Notification[] {
  const index = items.findIndex((current) => current.id === next.id)

  if (index === -1) {
    return sortNotifications([next, ...items])
  }

  const updated = [...items]
  updated[index] = next
  return sortNotifications(updated)
}

function notifyClient(title: string, body: string, preferences: NotificationPreferences) {
  if (preferences.desktop && "Notification" in window && window.Notification.permission === "granted") {
    new window.Notification(title, {
      body,
      icon: "/favicon.ico",
    })
  }

  if (preferences.sound) {
    console.log("[notifications] sound placeholder")
  }
}

function isNotificationTypeEnabled(type: Notification["type"], preferences: NotificationPreferences): boolean {
  return preferences[notificationTypeToPreferenceKey[type]]
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)
  const preferencesRef = useRef(preferences)

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem("notification-preferences")
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences))
      } catch (error) {
        console.error("Failed to load notification preferences:", error)
      }
    }
  }, [])

  useEffect(() => {
    preferencesRef.current = preferences
  }, [preferences])

  // Load backend notifications and subscribe to real-time updates
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      return
    }

    const spectatorId = resolveSpectatorId()
    if (!spectatorId) {
      setNotifications([])
      return
    }

    let cancelled = false
    let subscription: StompSubscription | null = null

    const loadHistory = async () => {
      try {
        const history = await getSpectatorNotifications(spectatorId)
        if (cancelled) return
        setNotifications(sortNotifications(history.map(mapBackendNotification)))
      } catch (error) {
        console.error("Failed to load notifications:", error)
        if (!cancelled) {
          setNotifications([])
        }
      }
    }

    loadHistory()

    const token = getTokenFromStorage()
    const client = new Client({
      webSocketFactory: () => new SockJS(NOTIFICATIONS_WS_URL) as WebSocket,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        subscription = client.subscribe(`/topic/notifications/${spectatorId}`, (message) => {
          try {
            const dto = JSON.parse(message.body) as BackendNotificationDTO
            const mapped = mapBackendNotification(dto)

            if (!isNotificationTypeEnabled(mapped.type, preferencesRef.current)) {
              return
            }

            setNotifications((prev) => upsertNotification(prev, mapped))
            notifyClient(mapped.title, mapped.message, preferencesRef.current)
          } catch (error) {
            console.error("Failed to parse notification message:", error)
          }
        })
      },
      onStompError: (frame) => {
        console.error("Notifications STOMP error:", frame.headers["message"] || frame.body)
      },
      onWebSocketError: (event) => {
        console.error("Notifications WebSocket error:", event)
      },
    })

    client.activate()

    return () => {
      cancelled = true
      if (subscription) {
        subscription.unsubscribe()
      }
      client.deactivate()
    }
  }, [isAuthenticated, user?.email, user?.role])

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    if (!isNotificationTypeEnabled(notification.type, preferences)) {
      return
    }

    const newNotification: Notification = {
      ...notification,
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      timestamp: new Date(),
      read: false,
    }

    setNotifications((prev) => sortNotifications([newNotification, ...prev]))
    notifyClient(notification.title, notification.message, preferences)
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))

    const serverId = extractServerId(id)
    if (!serverId) {
      return
    }

    markNotificationAsRead(serverId).catch((error) => {
      console.error("Failed to mark notification as read:", error)
    })
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))

    const spectatorId = resolveSpectatorId()
    if (!spectatorId) {
      return
    }

    markAllSpectatorNotificationsAsRead(spectatorId).catch((error) => {
      console.error("Failed to mark all notifications as read:", error)
    })
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))

    const serverId = extractServerId(id)
    if (!serverId) {
      return
    }

    deleteNotificationById(serverId).catch((error) => {
      console.error("Failed to delete notification:", error)
    })
  }

  const clearAll = () => {
    const serverIds = notifications
      .map((notification) => extractServerId(notification.id))
      .filter((id): id is number => id !== null)

    setNotifications([])

    serverIds.forEach((id) => {
      deleteNotificationById(id).catch((error) => {
        console.error("Failed to delete notification:", error)
      })
    })
  }

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences }
    setPreferences(updated)
    localStorage.setItem("notification-preferences", JSON.stringify(updated))

    // Request desktop notification permission if enabled
    if (updated.desktop && "Notification" in window && window.Notification.permission === "default") {
      window.Notification.requestPermission()
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        preferences,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}
