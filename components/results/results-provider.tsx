"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useNotifications } from "@/components/notifications/notification-provider"

export interface Athlete {
  id: string
  name: string
  country: string
  lane?: number
  seed?: string
}

export interface Result {
  id: string
  eventId: string
  athleteId: string
  athleteName: string
  country: string
  time: string
  position: number
  lane?: number
  splits?: string[]
  isRecord?: "WR" | "ER" | "CR" | "NR" | "PB" | null
  status: "official" | "provisional" | "disqualified"
  timestamp: Date
}

export interface Event {
  id: string
  name: string
  category: string
  gender: "men" | "women" | "mixed"
  distance: string
  stroke: string
  type: "individual" | "relay"
  stage: "heats" | "semi" | "final"
  scheduledTime: string
  status: "scheduled" | "in-progress" | "completed" | "cancelled"
  venue: string
  athletes: Athlete[]
  results: Result[]
}

interface ResultsContextType {
  events: Event[]
  results: Result[]
  addResult: (result: Omit<Result, "id" | "timestamp">) => void
  updateResult: (id: string, updates: Partial<Result>) => void
  deleteResult: (id: string) => void
  getEventResults: (eventId: string) => Result[]
  getAthleteResults: (athleteId: string) => Result[]
  addEvent: (event: Omit<Event, "id" | "results">) => void
  updateEventStatus: (eventId: string, status: Event["status"]) => void
}

const ResultsContext = createContext<ResultsContextType | undefined>(undefined)

// Sample events data
const sampleEvents: Event[] = [
  {
    id: "men-200-free-final",
    name: "Men's 200m Freestyle",
    category: "Swimming",
    gender: "men",
    distance: "200m",
    stroke: "Freestyle",
    type: "individual",
    stage: "final",
    scheduledTime: "14:30",
    status: "completed",
    venue: "Centre Aquatique Olympique",
    athletes: [
      { id: "leon-marchand", name: "Léon Marchand", country: "FRA", lane: 4, seed: "1:44.32" },
      { id: "adam-peaty", name: "Adam Peaty", country: "GBR", lane: 5, seed: "1:44.89" },
      { id: "marco-koch", name: "Marco Koch", country: "GER", lane: 3, seed: "1:45.12" },
    ],
    results: [
      {
        id: "result-1",
        eventId: "men-200-free-final",
        athleteId: "leon-marchand",
        athleteName: "Léon Marchand",
        country: "FRA",
        time: "1:44.15",
        position: 1,
        lane: 4,
        splits: ["25.32", "52.18", "1:18.45", "1:44.15"],
        isRecord: "CR",
        status: "official",
        timestamp: new Date(),
      },
      {
        id: "result-2",
        eventId: "men-200-free-final",
        athleteId: "adam-peaty",
        athleteName: "Adam Peaty",
        country: "GBR",
        time: "1:44.67",
        position: 2,
        lane: 5,
        splits: ["25.45", "52.34", "1:18.78", "1:44.67"],
        status: "official",
        timestamp: new Date(),
      },
    ],
  },
  {
    id: "women-100-fly-semi",
    name: "Women's 100m Butterfly",
    category: "Swimming",
    gender: "women",
    distance: "100m",
    stroke: "Butterfly",
    type: "individual",
    stage: "semi",
    scheduledTime: "15:15",
    status: "in-progress",
    venue: "Centre Aquatique Olympique",
    athletes: [
      { id: "sarah-sjostrom", name: "Sarah Sjöström", country: "SWE", lane: 4, seed: "55.48" },
      { id: "maggie-macneil", name: "Maggie MacNeil", country: "CAN", lane: 5, seed: "55.92" },
    ],
    results: [],
  },
]

export function ResultsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>(sampleEvents)
  const [results, setResults] = useState<Result[]>([])
  const { addNotification } = useNotifications()

  // Flatten all results from events
  useEffect(() => {
    const allResults = events.flatMap((event) => event.results)
    setResults(allResults)
  }, [events])

  const addResult = (result: Omit<Result, "id" | "timestamp">) => {
    const newResult: Result = {
      ...result,
      id: `result-${Date.now()}`,
      timestamp: new Date(),
    }

    // Update the event with the new result
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id === result.eventId) {
          const updatedResults = [...event.results, newResult].sort((a, b) => a.position - b.position)
          return { ...event, results: updatedResults }
        }
        return event
      }),
    )

    // Send notification for new result
    addNotification({
      type: "result",
      title: "New Result",
      message: `${result.athleteName} finished ${getPositionText(result.position)} in ${result.time}`,
      priority: result.position <= 3 ? "high" : "medium",
    })
  }

  const updateResult = (id: string, updates: Partial<Result>) => {
    setEvents((prev) =>
      prev.map((event) => ({
        ...event,
        results: event.results.map((result) => (result.id === id ? { ...result, ...updates } : result)),
      })),
    )
  }

  const deleteResult = (id: string) => {
    setEvents((prev) =>
      prev.map((event) => ({
        ...event,
        results: event.results.filter((result) => result.id !== id),
      })),
    )
  }

  const getEventResults = (eventId: string) => {
    const event = events.find((e) => e.id === eventId)
    return event?.results || []
  }

  const getAthleteResults = (athleteId: string) => {
    return results.filter((result) => result.athleteId === athleteId)
  }

  const addEvent = (event: Omit<Event, "id" | "results">) => {
    const newEvent: Event = {
      ...event,
      id: `event-${Date.now()}`,
      results: [],
    }
    setEvents((prev) => [...prev, newEvent])
  }

  const updateEventStatus = (eventId: string, status: Event["status"]) => {
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id === eventId) {
          // Send notification when event completes
          if (status === "completed" && event.status !== "completed") {
            addNotification({
              type: "event",
              title: "Event Completed",
              message: `${event.name} has finished`,
              priority: "medium",
            })
          }
          return { ...event, status }
        }
        return event
      }),
    )
  }

  return (
    <ResultsContext.Provider
      value={{
        events,
        results,
        addResult,
        updateResult,
        deleteResult,
        getEventResults,
        getAthleteResults,
        addEvent,
        updateEventStatus,
      }}
    >
      {children}
    </ResultsContext.Provider>
  )
}

export function useResults() {
  const context = useContext(ResultsContext)
  if (context === undefined) {
    throw new Error("useResults must be used within a ResultsProvider")
  }
  return context
}

function getPositionText(position: number): string {
  if (position === 1) return "1st"
  if (position === 2) return "2nd"
  if (position === 3) return "3rd"
  return `${position}th`
}
