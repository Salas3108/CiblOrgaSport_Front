import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Heart, Calendar, Users, MapPin, Clock, CheckCircle, AlertCircle, MessageSquare } from "lucide-react"

export default function VolunteerPage() {
  return (
    <ProtectedRoute allowedRoles={["volunteer"]}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Volunteer Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-chart-4 flex items-center justify-center">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Hector Moreau</h1>
                  <p className="text-muted-foreground">Volunteer • French Swimming Federation</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge>Volunteer</Badge>
                    <Badge variant="secondary">CEN Accredited</Badge>
                  </div>
                </div>
              </div>
              <Button>
                <MessageSquare className="h-4 w-4 mr-2" />
                Team Chat
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Daily Schedule */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Today's Schedule</span>
                    </CardTitle>
                    <CardDescription>Your assigned tasks for March 18, 2026</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        time: "08:00 - 10:00",
                        task: "Spectator Welcome & Orientation",
                        location: "Main Entrance",
                        status: "completed",
                        description: "Greet visitors and provide venue information",
                      },
                      {
                        time: "10:30 - 12:30",
                        task: "Athlete Support Services",
                        location: "Warm-up Pool",
                        status: "in-progress",
                        description: "Assist athletes with equipment and directions",
                      },
                      {
                        time: "14:00 - 16:00",
                        task: "Medal Ceremony Support",
                        location: "Competition Pool",
                        status: "upcoming",
                        description: "Help organize medal presentation logistics",
                      },
                      {
                        time: "16:30 - 18:00",
                        task: "Transport Coordination",
                        location: "Athlete Village",
                        status: "upcoming",
                        description: "Coordinate shuttle services for athletes",
                      },
                    ].map((task, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="mt-1">
                          <Checkbox checked={task.status === "completed"} disabled={task.status !== "in-progress"} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{task.task}</div>
                            <Badge
                              variant={
                                task.status === "completed"
                                  ? "default"
                                  : task.status === "in-progress"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {task.status === "in-progress" ? "Current" : task.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{task.description}</div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{task.time}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{task.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Team Communication */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Team Updates</span>
                    </CardTitle>
                    <CardDescription>Recent messages from your volunteer coordinators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      {
                        from: "Marie Coordinator",
                        time: "10 minutes ago",
                        message: "Great job with the morning welcome shift! Athletes appreciated your help.",
                        type: "praise",
                      },
                      {
                        from: "Event Operations",
                        time: "1 hour ago",
                        message: "Reminder: Medal ceremony volunteers report 15 minutes early for briefing.",
                        type: "info",
                      },
                      {
                        from: "Transport Team",
                        time: "2 hours ago",
                        message: "Schedule change: Evening shuttle service extended until 19:00.",
                        type: "update",
                      },
                    ].map((message, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{message.from}</span>
                          <span className="text-xs text-muted-foreground">{message.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{message.message}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Incident Reports */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5" />
                      <span>Incident Notifications</span>
                    </CardTitle>
                    <CardDescription>Security and operational updates for your area</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">All Clear</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        No incidents reported in your assigned areas today.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Volunteer Stats & Quick Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>My Stats</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Hours Today</span>
                        <span className="font-medium">6.5</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Hours</span>
                        <span className="font-medium">42</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tasks Completed</span>
                        <span className="font-medium">18</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Team Rating</span>
                        <span className="font-medium">⭐ 4.9</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tomorrow's Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <div className="font-medium">March 19, 2026</div>
                      <div className="text-muted-foreground">4 tasks assigned</div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>09:00 - Medical Support</div>
                      <div>11:30 - Ceremony Preparation</div>
                      <div>14:00 - VIP Services</div>
                      <div>16:30 - Equipment Management</div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full bg-transparent">
                      View Full Schedule
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-transparent" variant="outline">
                      Check In/Out
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      Request Break
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      Report Issue
                    </Button>
                    <Button className="w-full bg-transparent" variant="outline">
                      Contact Supervisor
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recognition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className="text-2xl">🏆</div>
                      <div className="text-sm font-medium">Volunteer of the Week</div>
                      <div className="text-xs text-muted-foreground">
                        Outstanding dedication to athlete support services
                      </div>
                    </div>
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
