import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { InteractiveMap } from "@/components/maps/interactive-map"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Users, Navigation, Phone } from "lucide-react"

const venues = [
  {
    id: "cao",
    name: "Centre Aquatique Olympique",
    address: "Île Saint-Denis, 93450 Saint-Denis",
    description: "Main competition venue for swimming, diving, and water polo events",
    capacity: 15000,
    events: ["Swimming Finals", "Diving Competitions", "Water Polo Matches"],
    facilities: ["Competition Pool", "Warm-up Pool", "Diving Platforms", "Spectator Areas"],
    transport: ["Metro Line 13 - Saint-Denis", "Bus Lines 153, 253"],
    contact: "+33 1 49 46 10 00",
  },
  {
    id: "training-center",
    name: "Training Center Complex",
    address: "Avenue du Président Wilson, 93210 Saint-Denis",
    description: "Dedicated training and warm-up facilities for athletes",
    capacity: 500,
    events: ["Training Sessions", "Warm-up Periods"],
    facilities: ["Training Pools", "Gym Facilities", "Recovery Areas"],
    transport: ["Metro Line 13 - Saint-Denis", "Tram T1"],
    contact: "+33 1 49 46 10 01",
  },
]

export default function VenuesPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold">Venues & Navigation</h1>
              <p className="text-muted-foreground">
                Find your way around the championship venues and discover nearby amenities
              </p>
            </div>

            {/* Interactive Map */}
            <InteractiveMap />

            {/* Venue Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Competition Venues</h2>
              <div className="grid lg:grid-cols-2 gap-6">
                {venues.map((venue) => (
                  <Card key={venue.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <MapPin className="h-5 w-5" />
                        <span>{venue.name}</span>
                      </CardTitle>
                      <CardDescription>{venue.address}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{venue.description}</p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{venue.capacity.toLocaleString()} capacity</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{venue.contact}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Events</h4>
                        <div className="flex flex-wrap gap-2">
                          {venue.events.map((event) => (
                            <Badge key={event} variant="outline">
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Facilities</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {venue.facilities.map((facility) => (
                            <li key={facility} className="flex items-center space-x-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              <span>{facility}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Transport</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {venue.transport.map((transport) => (
                            <li key={transport} className="flex items-center space-x-2">
                              <Navigation className="h-3 w-3" />
                              <span>{transport}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Button className="w-full">
                        <Navigation className="h-4 w-4 mr-2" />
                        Get Directions
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Access */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Access</CardTitle>
                <CardDescription>Frequently needed locations and services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { name: "Emergency Services", icon: Phone, description: "Medical and security contacts" },
                    { name: "Fan Zones", icon: Users, description: "Meet other supporters" },
                    { name: "Transport Hub", icon: Navigation, description: "Metro, bus, and taxi services" },
                  ].map((item) => {
                    const IconComponent = item.icon
                    return (
                      <Button
                        key={item.name}
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-start bg-transparent"
                      >
                        <IconComponent className="h-5 w-5 mb-2" />
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
