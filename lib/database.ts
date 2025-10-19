// Database service layer for CiblOrgaSport
import type { User, Event, Participant, Result, Incident, Notification, Venue, Schedule } from "./types"

// Simulated database storage (in production, this would connect to a real SQL database)
class DatabaseService {
  private users: Map<string, User> = new Map()
  private events: Map<string, Event> = new Map()
  private participants: Map<string, Participant> = new Map()
  private results: Map<string, Result> = new Map()
  private incidents: Map<string, Incident> = new Map()
  private notifications: Map<string, Notification> = new Map()
  private venues: Map<string, Venue> = new Map()
  private schedules: Map<string, Schedule> = new Map()

  constructor() {
    this.initializeData()
  }

  private initializeData() {
    // Initialize with sample data
    const sampleVenues: Venue[] = [
      {
        id: "1",
        name: "Centre Aquatique Olympique",
        address: "1 Promenade du Belvédère, 93210 Saint-Denis",
        latitude: 48.9356,
        longitude: 2.3539,
        capacity: 15000,
        facilities: ["50m Pool", "Warm-up Pool", "Diving Pool", "Medical Center"],
        accessInfo: "Metro Line 13 - Saint-Denis Université",
        emergencyContacts: ["+33 1 48 13 60 00"],
      },
      {
        id: "2",
        name: "Piscine Olympique de Dijon",
        address: "Avenue du Lac, 21000 Dijon",
        latitude: 47.322,
        longitude: 5.0415,
        capacity: 3000,
        facilities: ["25m Pool", "Water Polo Arena", "Training Pool"],
        accessInfo: "Tram Line T1 - Lac Kir",
        emergencyContacts: ["+33 3 80 48 82 82"],
      },
    ]

    sampleVenues.forEach((venue) => this.venues.set(venue.id, venue))

    // Sample events
    const sampleEvents: Event[] = [
      {
        id: "1",
        name: "200m Freestyle Men Final",
        type: "competition",
        sport: "Swimming",
        discipline: "Freestyle",
        venue: "Centre Aquatique Olympique",
        startTime: new Date("2026-08-15T19:30:00"),
        endTime: new Date("2026-08-15T19:45:00"),
        status: "scheduled",
        maxParticipants: 8,
        description: "Men 200m Freestyle Final",
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Women Water Polo Semifinals",
        type: "competition",
        sport: "Water Polo",
        discipline: "Team",
        venue: "Piscine Olympique de Dijon",
        startTime: new Date("2026-08-16T14:00:00"),
        endTime: new Date("2026-08-16T15:30:00"),
        status: "scheduled",
        maxParticipants: 26,
        description: "Women Water Polo Semifinals",
        createdBy: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    sampleEvents.forEach((event) => this.events.set(event.id, event))
  }

  // User operations
  async createUser(userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const user: User = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.users.set(user.id, user)
    return user
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user
    }
    return null
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id)
    if (!user) return null

    const updatedUser = { ...user, ...updates, updatedAt: new Date() }
    this.users.set(id, updatedUser)
    return updatedUser
  }

  // Event operations
  async createEvent(eventData: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<Event> {
    const event: Event = {
      ...eventData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.events.set(event.id, event)
    return event
  }

  async getEvents(filters?: { type?: string; status?: string; venue?: string }): Promise<Event[]> {
    let events = Array.from(this.events.values())

    if (filters) {
      if (filters.type) events = events.filter((e) => e.type === filters.type)
      if (filters.status) events = events.filter((e) => e.status === filters.status)
      if (filters.venue) events = events.filter((e) => e.venue === filters.venue)
    }

    return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
    const event = this.events.get(id)
    if (!event) return null

    const updatedEvent = { ...event, ...updates, updatedAt: new Date() }
    this.events.set(id, updatedEvent)
    return updatedEvent
  }

  // Result operations
  async createResult(resultData: Omit<Result, "id" | "createdAt">): Promise<Result> {
    const result: Result = {
      ...resultData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    }
    this.results.set(result.id, result)
    return result
  }

  async getResultsByEvent(eventId: string): Promise<Result[]> {
    return Array.from(this.results.values())
      .filter((r) => r.eventId === eventId)
      .sort((a, b) => a.position - b.position)
  }

  // Incident operations
  async createIncident(incidentData: Omit<Incident, "id" | "createdAt" | "updatedAt">): Promise<Incident> {
    const incident: Incident = {
      ...incidentData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.incidents.set(incident.id, incident)
    return incident
  }

  async getIncidents(filters?: { status?: string; severity?: string }): Promise<Incident[]> {
    let incidents = Array.from(this.incidents.values())

    if (filters) {
      if (filters.status) incidents = incidents.filter((i) => i.status === filters.status)
      if (filters.severity) incidents = incidents.filter((i) => i.severity === filters.severity)
    }

    return incidents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | null> {
    const incident = this.incidents.get(id)
    if (!incident) return null

    const updatedIncident = { ...incident, ...updates, updatedAt: new Date() }
    this.incidents.set(id, updatedIncident)
    return updatedIncident
  }

  // Notification operations
  async createNotification(notificationData: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
    const notification: Notification = {
      ...notificationData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
    }
    this.notifications.set(notification.id, notification)
    return notification
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    const notification = this.notifications.get(id)
    if (!notification) return false

    notification.isRead = true
    this.notifications.set(id, notification)
    return true
  }

  // Venue operations
  async getVenues(): Promise<Venue[]> {
    return Array.from(this.venues.values())
  }

  async getVenueById(id: string): Promise<Venue | null> {
    return this.venues.get(id) || null
  }
}

export const db = new DatabaseService()
