import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClipboardCheck, Trophy, AlertTriangle, Clock, CheckCircle, XCircle, Edit } from "lucide-react"

export default function OfficialPage() {
  return (
    <ProtectedRoute allowedRoles={["official"]}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Official Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center">
                  <ClipboardCheck className="h-8 w-8 text-accent-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Arthur Dubois</h1>
                  <p className="text-muted-foreground">Sports Commissioner • Open Water Swimming</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge>Official</Badge>
                    <Badge variant="secondary">CEN Accredited</Badge>
                  </div>
                </div>
              </div>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Update Status
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Competition Management */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Competition Control</CardTitle>
                    <CardDescription>Manage events and validate results</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        event: "Men's 10km Open Water",
                        time: "09:00",
                        status: "ready",
                        participants: 24,
                        weather: "Suitable",
                      },
                      {
                        event: "Women's 5km Open Water",
                        time: "11:30",
                        status: "pending",
                        participants: 18,
                        weather: "Under Review",
                      },
                      {
                        event: "Mixed Team Relay",
                        time: "14:00",
                        status: "scheduled",
                        participants: 16,
                        weather: "Good",
                      },
                    ].map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{event.event}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.time} • {event.participants} participants • Weather: {event.weather}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              event.status === "ready"
                                ? "default"
                                : event.status === "pending"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {event.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Participant Verification */}
                <Card>
                  <CardHeader>
                    <CardTitle>Participant Verification</CardTitle>
                    <CardDescription>Check European Charter compliance</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        name: "Léon Marchand",
                        country: "FRA",
                        charter: "verified",
                        medical: "valid",
                        doping: "compliant",
                      },
                      {
                        name: "Sarah Johnson",
                        country: "GBR",
                        charter: "verified",
                        medical: "valid",
                        doping: "pending",
                      },
                      {
                        name: "Marco Rossi",
                        country: "ITA",
                        charter: "pending",
                        medical: "valid",
                        doping: "compliant",
                      },
                    ].map((participant, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {participant.name} ({participant.country})
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className="flex items-center space-x-1">
                              {participant.charter === "verified" ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <Clock className="h-3 w-3 text-yellow-500" />
                              )}
                              <span>Charter</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {participant.medical === "valid" ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                              <span>Medical</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {participant.doping === "compliant" ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <Clock className="h-3 w-3 text-yellow-500" />
                              )}
                              <span>Anti-Doping</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Results Entry */}
                <Card>
                  <CardHeader>
                    <CardTitle>Results Entry</CardTitle>
                    <CardDescription>Manual result input for completed events</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="event">Event</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="men-10km">Men's 10km Open Water</SelectItem>
                            <SelectItem value="women-5km">Women's 5km Open Water</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Position</Label>
                        <Input placeholder="1st, 2nd, 3rd..." />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="athlete">Athlete</Label>
                        <Input placeholder="Athlete name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Time</Label>
                        <Input placeholder="HH:MM:SS.ms" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea placeholder="Additional notes or observations" />
                    </div>
                    <Button className="w-full">Submit Results</Button>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Status */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trophy className="h-5 w-5" />
                      <span>Today's Events</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Events Assigned</span>
                        <span className="font-medium">3</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Completed</span>
                        <span className="font-medium">1</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>In Progress</span>
                        <span className="font-medium">1</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Upcoming</span>
                        <span className="font-medium">1</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Weather Alert</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant="secondary">Monitoring</Badge>
                      <p className="text-sm text-muted-foreground">
                        Wind conditions under review for afternoon events. Decision pending at 13:00.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-transparent" variant="outline">
                      Cancel Event
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      Reschedule Event
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      Add Participant
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      Generate Report
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
