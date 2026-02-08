import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Eye, MapPin, Bell, Shield, Calendar, Trophy, Navigation, Users, Clock } from "lucide-react"

export default function SpectatorPage() {
  return (
    <ProtectedRoute allowedRoles={["spectator"]}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Spectator Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-chart-2 flex items-center justify-center">
                  <Eye className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Suzanne Martin</h1>
                  <p className="text-muted-foreground">Spectator • Diving Enthusiast</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge>Spectator</Badge>
                    <Badge variant="secondary">3 Tickets</Badge>
                  </div>
                </div>
              </div>
              <Button>
                <MapPin className="h-4 w-4 mr-2" />
                Find Venues
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* My Events & Tickets */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>My Events</span>
                    </CardTitle>
                    <CardDescription>Your purchased tickets and event schedule</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        event: "Women's 10m Platform Diving",
                        stage: "Final",
                        date: "Today",
                        time: "15:30",
                        venue: "Aquatic Centre",
                        seat: "Section A, Row 12, Seat 15",
                        status: "upcoming",
                      },
                      {
                        event: "Men's 3m Springboard Diving",
                        stage: "Semi-Final",
                        date: "Tomorrow",
                        time: "14:00",
                        venue: "Aquatic Centre",
                        seat: "Section B, Row 8, Seat 22",
                        status: "scheduled",
                      },
                      {
                        event: "Mixed Synchronized Diving",
                        stage: "Final",
                        date: "March 20",
                        time: "16:45",
                        venue: "Aquatic Centre",
                        seat: "Section A, Row 5, Seat 8",
                        status: "scheduled",
                      },
                    ].map((ticket, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{ticket.event}</div>
                          <div className="text-sm text-muted-foreground">{ticket.stage}</div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {ticket.date} at {ticket.time}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{ticket.venue}</span>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{ticket.seat}</div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge variant={ticket.status === "upcoming" ? "default" : "secondary"}>
                            {ticket.status}
                          </Badge>
                          <div>
                            <Button size="sm" variant="outline">
                              Directions
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Live Results - Diving Focus */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trophy className="h-5 w-5" />
                      <span>Diving Results</span>
                    </CardTitle>
                    <CardDescription>Live updates from your favorite events</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-primary/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Women's 10m Platform - Final</span>
                        <Badge className="bg-primary">LIVE</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>1st - Chen Yuxi (CHN)</span>
                          <span className="font-mono">412.75</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>2nd - Quan Hongchan (CHN)</span>
                          <span className="font-mono">398.25</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>3rd - Andrea Spendolini-Sirieix (GBR)</span>
                          <span className="font-mono">365.40</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { event: "Men's 3m Springboard", winner: "Jack Laugher (GBR)", score: "456.95" },
                        { event: "Women's Synchronized 3m", winner: "GBR Team", score: "314.88" },
                      ].map((result, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="text-sm font-medium">{result.event}</div>
                          <div className="text-xs text-muted-foreground mt-1">{result.winner}</div>
                          <div className="text-lg font-mono font-bold text-primary mt-1">{result.score}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Venue Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Navigation className="h-5 w-5" />
                      <span>Venue Guide</span>
                    </CardTitle>
                    <CardDescription>Navigate the championship venues</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-start bg-transparent">
                        <MapPin className="h-5 w-5 mb-2" />
                        <span className="font-medium">Venue Maps</span>
                        <span className="text-xs text-muted-foreground">Interactive floor plans</span>
                      </Button>
                      <Button variant="outline" className="h-auto p-4 flex flex-col items-start bg-transparent">
                        <Users className="h-5 w-5 mb-2" />
                        <span className="font-medium">Fan Zones</span>
                        <span className="text-xs text-muted-foreground">Meet other fans</span>
                      </Button>
                    </div>
                    <div className="p-3 border rounded-lg bg-muted/50">
                      <div className="text-sm font-medium mb-1">Nearest Fan Zone</div>
                      <div className="text-xs text-muted-foreground">
                        Place de la République - 0.8km from your location
                      </div>
                      <Button size="sm" variant="outline" className="mt-2 bg-transparent">
                        Get Directions
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Notifications & Safety */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>Notifications</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="diving-results" className="text-sm">
                          Diving Results
                        </Label>
                        <Switch id="diving-results" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="event-updates" className="text-sm">
                          Event Updates
                        </Label>
                        <Switch id="event-updates" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="security-alerts" className="text-sm">
                          Security Alerts
                        </Label>
                        <Switch id="security-alerts" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="venue-info" className="text-sm">
                          Venue Information
                        </Label>
                        <Switch id="venue-info" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Safety & Security</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">All Clear</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">No security incidents reported</p>
                    </div>
                    <Button className="w-full bg-transparent" variant="outline">
                      Emergency Contacts
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      Report Incident
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-transparent" variant="outline">
                      Download Tickets
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      Share Location
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
