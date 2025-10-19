"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences)

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

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random notifications based on user role
      const user = JSON.parse(localStorage.getItem("user") || "{}")
      if (!user.authenticated) return

      const sampleNotifications = [
        {
          type: "result" as const,
          title: "New Result",
          message: "Men's 200m Freestyle Final completed - Léon Marchand wins gold!",
          priority: "high" as const,
          category: "Swimming",
        },
        {
          type: "security" as const,
          title: "Security Update",
          message: "All venues operating normally. No incidents reported.",
          priority: "medium" as const,
        },
        {
          type: "event" as const,
          title: "Event Update",
          message: "Women's 100m Butterfly Semi-Final delayed by 15 minutes",
          priority: "medium" as const,
        },
        {
          type: "personal" as const,
          title: "Schedule Reminder",
          message: "Your next event starts in 30 minutes",
          priority: "high" as const,
        },
      ]

      // Random chance to send a notification
      if (Math.random() < 0.3) {
        const randomNotification = sampleNotifications[Math.floor(Math.random() * sampleNotifications.length)]
        addNotification(randomNotification)
      }
    }, 15000) // Every 15 seconds

    return () => clearInterval(interval)
  }, [])

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    // Check if this type of notification is enabled
    if (!preferences[notification.type]) return

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)) // Keep only last 50

    // Show desktop notification if enabled
    if (preferences.desktop && "Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
      })
    }

    // Play sound if enabled
    if (preferences.sound) {
      // In a real app, you'd play an actual sound file
      console.log("[v0] Notification sound would play here")
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    const updated = { ...preferences, ...newPreferences }
    setPreferences(updated)
    localStorage.setItem("notification-preferences", JSON.stringify(updated))

    // Request desktop notification permission if enabled
    if (updated.desktop && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
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
