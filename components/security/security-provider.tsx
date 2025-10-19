"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useNotifications } from "@/components/notifications/notification-provider"

export interface Incident {
  id: string
  title: string
  description: string
  type: "security" | "medical" | "technical" | "weather" | "crowd" | "other"
  severity: "low" | "medium" | "high" | "critical"
  status: "reported" | "investigating" | "resolved" | "closed"
  location: string
  venue?: string
  reportedBy: string
  reportedAt: Date
  resolvedAt?: Date
  affectedAudience: "all" | "commissioners" | "commissioners-athletes" | "venue-specific"
  assignedTo?: string
  updates: IncidentUpdate[]
}

export interface IncidentUpdate {
  id: string
  message: string
  timestamp: Date
  author: string
}

export interface SecurityAlert {
  id: string
  title: string
  message: string
  type: "emergency" | "warning" | "info"
  venue?: string
  isActive: boolean
  createdAt: Date
  expiresAt?: Date
}

interface SecurityContextType {
  incidents: Incident[]
  alerts: SecurityAlert[]
  addIncident: (incident: Omit<Incident, "id" | "reportedAt" | "updates">) => void
  updateIncident: (id: string, updates: Partial<Incident>) => void
  addIncidentUpdate: (incidentId: string, message: string, author: string) => void
  createAlert: (alert: Omit<SecurityAlert, "id" | "createdAt">) => void
  dismissAlert: (id: string) => void
  getActiveAlerts: () => SecurityAlert[]
  getIncidentsByVenue: (venue: string) => Incident[]
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

// Sample incidents data
const sampleIncidents: Incident[] = [
  {
    id: "incident-1",
    title: "Minor Medical Incident",
    description: "Spectator feeling unwell in Section A",
    type: "medical",
    severity: "low",
    status: "resolved",
    location: "Section A, Row 15",
    venue: "Centre Aquatique Olympique",
    reportedBy: "Security Team Alpha",
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    affectedAudience: "venue-specific",
    assignedTo: "Medical Team 1",
    updates: [
      {
        id: "update-1",
        message: "Medical team dispatched to location",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        author: "Control Room",
      },
      {
        id: "update-2",
        message: "Patient treated and feeling better, no evacuation needed",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        author: "Medical Team 1",
      },
    ],
  },
]

const sampleAlerts: SecurityAlert[] = [
  {
    id: "alert-1",
    title: "All Clear",
    message: "All venues operating normally. No security incidents reported.",
    type: "info",
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
  },
]

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>(sampleIncidents)
  const [alerts, setAlerts] = useState<SecurityAlert[]>(sampleAlerts)
  const { addNotification } = useNotifications()

  // Clean up expired alerts
  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts((prev) =>
        prev.map((alert) => {
          if (alert.expiresAt && alert.expiresAt < new Date()) {
            return { ...alert, isActive: false }
          }
          return alert
        }),
      )
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const addIncident = (incident: Omit<Incident, "id" | "reportedAt" | "updates">) => {
    const newIncident: Incident = {
      ...incident,
      id: `incident-${Date.now()}`,
      reportedAt: new Date(),
      updates: [],
    }

    setIncidents((prev) => [newIncident, ...prev])

    // Send notification based on severity and audience
    const priority = incident.severity === "critical" ? "urgent" : incident.severity === "high" ? "high" : "medium"

    addNotification({
      type: "security",
      title: "Security Incident",
      message: `${incident.title} - ${incident.location}`,
      priority,
    })

    // Create automatic alert for high/critical incidents
    if (incident.severity === "high" || incident.severity === "critical") {
      createAlert({
        title: `${incident.severity.toUpperCase()}: ${incident.title}`,
        message: `Location: ${incident.location}. Please follow instructions from security personnel.`,
        type: incident.severity === "critical" ? "emergency" : "warning",
        venue: incident.venue,
        isActive: true,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      })
    }
  }

  const updateIncident = (id: string, updates: Partial<Incident>) => {
    setIncidents((prev) =>
      prev.map((incident) => {
        if (incident.id === id) {
          const updated = { ...incident, ...updates }

          // If status changed to resolved, set resolvedAt
          if (updates.status === "resolved" && incident.status !== "resolved") {
            updated.resolvedAt = new Date()
          }

          return updated
        }
        return incident
      }),
    )
  }

  const addIncidentUpdate = (incidentId: string, message: string, author: string) => {
    const update: IncidentUpdate = {
      id: `update-${Date.now()}`,
      message,
      timestamp: new Date(),
      author,
    }

    setIncidents((prev) =>
      prev.map((incident) => {
        if (incident.id === incidentId) {
          return {
            ...incident,
            updates: [...incident.updates, update],
          }
        }
        return incident
      }),
    )
  }

  const createAlert = (alert: Omit<SecurityAlert, "id" | "createdAt">) => {
    const newAlert: SecurityAlert = {
      ...alert,
      id: `alert-${Date.now()}`,
      createdAt: new Date(),
    }

    setAlerts((prev) => [newAlert, ...prev])

    // Send notification for new alert
    addNotification({
      type: "security",
      title: "Security Alert",
      message: alert.message,
      priority: alert.type === "emergency" ? "urgent" : alert.type === "warning" ? "high" : "medium",
    })
  }

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, isActive: false } : alert)))
  }

  const getActiveAlerts = () => {
    return alerts.filter((alert) => alert.isActive)
  }

  const getIncidentsByVenue = (venue: string) => {
    return incidents.filter((incident) => incident.venue === venue)
  }

  return (
    <SecurityContext.Provider
      value={{
        incidents,
        alerts,
        addIncident,
        updateIncident,
        addIncidentUpdate,
        createAlert,
        dismissAlert,
        getActiveAlerts,
        getIncidentsByVenue,
      }}
    >
      {children}
    </SecurityContext.Provider>
  )
}

export function useSecurity() {
  const context = useContext(SecurityContext)
  if (context === undefined) {
    throw new Error("useSecurity must be used within a SecurityProvider")
  }
  return context
}
