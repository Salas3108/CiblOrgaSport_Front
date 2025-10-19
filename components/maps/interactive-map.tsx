"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGeolocation } from "./geolocation-provider"
import { MapPin, Navigation, Users, Trophy, Waves, Target } from "lucide-react"

interface MapLocation {
  id: string
  name: string
  type: "venue" | "fanzone" | "transport" | "medical" | "food" | "user"
  latitude: number
  longitude: number
  description?: string
  events?: string[]
  status?: "active" | "inactive" | "busy"
}

// Simulated locations in Paris area (around Centre Aquatique Olympique)
const parisLocations: MapLocation[] = [
  {
    id: "cao",
    name: "Centre Aquatique Olympique",
    type: "venue",
    latitude: 48.9356,
    longitude: 2.3539,
    description: "Main competition venue",
    events: ["Swimming", "Diving", "Water Polo"],
    status: "active",
  },
  {
    id: "warmup-pool",
    name: "Warm-up Pool Complex",
    type: "venue",
    latitude: 48.9345,
    longitude: 2.3525,
    description: "Training and warm-up facilities",
    status: "active",
  },
  {
    id: "fanzone-republique",
    name: "Fan Zone République",
    type: "fanzone",
    latitude: 48.8676,
    longitude: 2.3631,
    description: "Main fan gathering area",
    status: "active",
  },
  {
    id: "fanzone-bastille",
    name: "Fan Zone Bastille",
    type: "fanzone",
    latitude: 48.8532,
    longitude: 2.3692,
    description: "Secondary fan zone",
    status: "active",
  },
  {
    id: "metro-saint-denis",
    name: "Saint-Denis Metro Station",
    type: "transport",
    latitude: 48.9362,
    longitude: 2.3567,
    description: "Nearest metro station",
    status: "active",
  },
  {
    id: "medical-center",
    name: "Medical Center",
    type: "medical",
    latitude: 48.934,
    longitude: 2.3545,
    description: "Emergency medical services",
    status: "active",
  },
]

const locationIcons = {
  venue: Trophy,
  fanzone: Users,
  transport: Navigation,
  medical: Target,
  food: MapPin,
  user: MapPin,
}

const locationColors = {
  venue: "bg-primary",
  fanzone: "bg-chart-4",
  transport: "bg-chart-2",
  medical: "bg-red-500",
  food: "bg-orange-500",
  user: "bg-accent",
}

export function InteractiveMap() {
  const { position, isEnabled, enableTracking, disableTracking } = useGeolocation()
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null)
  const [locations, setLocations] = useState<MapLocation[]>(parisLocations)

  // Add user location to map when available
  useEffect(() => {
    if (position && isEnabled) {
      const userLocation: MapLocation = {
        id: "user-location",
        name: "Your Location",
        type: "user",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        description: "Your current position",
      }

      setLocations((prev) => {
        const filtered = prev.filter((loc) => loc.id !== "user-location")
        return [...filtered, userLocation]
      })
    } else {
      setLocations((prev) => prev.filter((loc) => loc.id !== "user-location"))
    }
  }, [position, isEnabled])

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const getDirections = (location: MapLocation) => {
    if (position) {
      const url = `https://www.google.com/maps/dir/${position.coords.latitude},${position.coords.longitude}/${location.latitude},${location.longitude}`
      window.open(url, "_blank")
    } else {
      const url = `https://www.google.com/maps/search/${location.latitude},${location.longitude}`
      window.open(url, "_blank")
    }
  }

  return (
    <div className="space-y-6">
      {/* Location Tracking Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Navigation className="h-5 w-5" />
            <span>Location Services</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable location tracking</p>
              <p className="text-xs text-muted-foreground">
                Allow the app to track your location for better navigation and safety features
              </p>
            </div>
            <Button
              variant={isEnabled ? "destructive" : "default"}
              onClick={isEnabled ? disableTracking : enableTracking}
            >
              {isEnabled ? "Disable" : "Enable"}
            </Button>
          </div>

          {position && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Current Location</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lat: {position.coords.latitude.toFixed(6)}, Lng: {position.coords.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-muted-foreground">Accuracy: ±{Math.round(position.coords.accuracy)}m</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Map Simulation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Waves className="h-5 w-5" />
            <span>Championship Venues Map</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg p-6 min-h-[400px]">
            {/* Map Grid Background */}
            <div className="absolute inset-0 opacity-20">
              <div className="grid grid-cols-8 grid-rows-6 h-full w-full">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border border-gray-300 dark:border-gray-600" />
                ))}
              </div>
            </div>

            {/* Location Markers */}
            <div className="relative h-full">
              {locations.map((location) => {
                const IconComponent = locationIcons[location.type]
                const distance = position
                  ? calculateDistance(
                      position.coords.latitude,
                      position.coords.longitude,
                      location.latitude,
                      location.longitude,
                    )
                  : null

                return (
                  <div
                    key={location.id}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${((location.longitude - 2.35) / 0.02) * 100}%`,
                      top: `${((48.94 - location.latitude) / 0.08) * 100}%`,
                    }}
                    onClick={() => setSelectedLocation(location)}
                  >
                    <div
                      className={`${locationColors[location.type]} p-2 rounded-full text-white shadow-lg hover:scale-110 transition-transform`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1">
                      <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {location.name}
                        {distance && <div>{distance.toFixed(1)}km</div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/90 p-3 rounded-lg">
              <h4 className="text-xs font-medium mb-2">Legend</h4>
              <div className="space-y-1">
                {Object.entries(locationIcons).map(([type, IconComponent]) => (
                  <div key={type} className="flex items-center space-x-2 text-xs">
                    <div className={`${locationColors[type as keyof typeof locationColors]} p-1 rounded`}>
                      <IconComponent className="h-3 w-3 text-white" />
                    </div>
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Details */}
      {selectedLocation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedLocation.name}</span>
              <Badge variant="secondary" className="capitalize">
                {selectedLocation.type}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedLocation.description && (
              <p className="text-sm text-muted-foreground">{selectedLocation.description}</p>
            )}

            {selectedLocation.events && (
              <div>
                <h4 className="text-sm font-medium mb-2">Events</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedLocation.events.map((event) => (
                    <Badge key={event} variant="outline">
                      {event}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {position && selectedLocation.id !== "user-location" && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Distance</p>
                  <p className="text-xs text-muted-foreground">
                    {calculateDistance(
                      position.coords.latitude,
                      position.coords.longitude,
                      selectedLocation.latitude,
                      selectedLocation.longitude,
                    ).toFixed(1)}{" "}
                    km from your location
                  </p>
                </div>
                <Button onClick={() => getDirections(selectedLocation)}>Get Directions</Button>
              </div>
            )}

            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setSelectedLocation(null)}>
                Close
              </Button>
              {selectedLocation.id !== "user-location" && (
                <Button onClick={() => getDirections(selectedLocation)}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Navigate
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
