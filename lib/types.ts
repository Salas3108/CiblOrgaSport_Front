// Database models and TypeScript interfaces for CiblOrgaSport

export interface User {
  id: string
  email: string
  password: string
  role: "athlete" | "official" | "spectator" | "volunteer" | "admin"
  firstName: string
  lastName: string
  nationality?: string
  accreditation?: string
  isTracked: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  name: string
  type: "competition" | "ceremony" | "training" | "other"
  sport: string
  discipline: string
  venue: string
  startTime: Date
  endTime: Date
  status: "scheduled" | "ongoing" | "completed" | "cancelled" | "postponed"
  maxParticipants?: number
  description?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Competition extends Event {
  category: "individual" | "relay" | "team"
  gender: "male" | "female" | "mixed"
  distance?: string
  style?: string
  round: "heats" | "semifinals" | "finals"
}

export interface Participant {
  id: string
  userId: string
  eventId: string
  lane?: number
  seedTime?: string
  status: "registered" | "confirmed" | "withdrawn" | "disqualified"
  registeredAt: Date
}

export interface Result {
  id: string
  eventId: string
  participantId: string
  time?: string
  score?: number
  position: number
  isRecord: boolean
  recordType?: "world" | "european" | "national" | "championship"
  validatedBy?: string
  validatedAt?: Date
  createdAt: Date
}

export interface Incident {
  id: string
  title: string
  description: string
  type: "security" | "medical" | "technical" | "weather" | "other"
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "in-progress" | "resolved" | "closed"
  location?: string
  eventId?: string
  affectedRoles: string[]
  reportedBy: string
  assignedTo?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "result" | "security" | "event" | "system" | "personal"
  priority: "low" | "medium" | "high" | "urgent"
  isRead: boolean
  data?: any
  expiresAt?: Date
  createdAt: Date
}

export interface Venue {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  capacity: number
  facilities: string[]
  accessInfo: string
  emergencyContacts: string[]
}

export interface Schedule {
  id: string
  userId: string
  eventId: string
  role: string
  tasks: string[]
  startTime: Date
  endTime: Date
  location: string
  instructions?: string
  createdAt: Date
}
