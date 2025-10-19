"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface GeolocationContextType {
  position: GeolocationPosition | null
  error: string | null
  isLoading: boolean
  isEnabled: boolean
  requestLocation: () => void
  enableTracking: () => void
  disableTracking: () => void
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined)

export function GeolocationProvider({ children }: { children: React.ReactNode }) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)

  // Check if geolocation is supported and get stored preference
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser")
      return
    }

    const storedPreference = localStorage.getItem("geolocation-enabled")
    if (storedPreference === "true") {
      setIsEnabled(true)
      requestLocation()
    }
  }, [])

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported")
      return
    }

    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition(pos)
        setIsLoading(false)
        console.log("[v0] Location obtained:", pos.coords.latitude, pos.coords.longitude)
      },
      (err) => {
        setError(err.message)
        setIsLoading(false)
        console.log("[v0] Geolocation error:", err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    )
  }

  const enableTracking = () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported")
      return
    }

    setIsEnabled(true)
    localStorage.setItem("geolocation-enabled", "true")

    // Start watching position
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos)
        console.log("[v0] Position updated:", pos.coords.latitude, pos.coords.longitude)
      },
      (err) => {
        setError(err.message)
        console.log("[v0] Geolocation watch error:", err.message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute for continuous tracking
      },
    )

    setWatchId(id)
    requestLocation()
  }

  const disableTracking = () => {
    setIsEnabled(false)
    localStorage.setItem("geolocation-enabled", "false")

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }

    setPosition(null)
    setError(null)
  }

  return (
    <GeolocationContext.Provider
      value={{
        position,
        error,
        isLoading,
        isEnabled,
        requestLocation,
        enableTracking,
        disableTracking,
      }}
    >
      {children}
    </GeolocationContext.Provider>
  )
}

export function useGeolocation() {
  const context = useContext(GeolocationContext)
  if (context === undefined) {
    throw new Error("useGeolocation must be used within a GeolocationProvider")
  }
  return context
}
