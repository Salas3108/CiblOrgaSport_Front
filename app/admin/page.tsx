import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Calendar, Trophy, AlertTriangle, TrendingUp, Settings, Plus, Eye, Edit } from "lucide-react"

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Admin Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Administration Dashboard</h1>
              <p className="text-muted-foreground">Marius - Event Deployment Manager</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                title: "Total Users",
                value: "2,847",
                change: "+156 today",
                icon: Users,
                color: "text-primary",
              },
              {
                title: "Active Events",
                value: "18",
                change: "6 live now",
                icon: Calendar,
                color: "text-accent",
              },
              {
                title: "Results Processed",
                value: "234",
                change: "+45 today",
                icon: Trophy,
                color: "text-chart-1",
              },
              {
                title: "System Alerts",
                value: "3",
                change: "2 resolved",
                icon: AlertTriangle,
                color: "text-destructive",
              },
            ].map((metric, index) => {
              const IconComponent = metric.icon
              return (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <p className="text-xs text-muted-foreground">{metric.change}</p>
                      </div>
                      <IconComponent className={`h-8 w-8 ${metric.color}`} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Event Management */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Event Management</CardTitle>
                  <CardDescription>Manage competitions and schedules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      event: "Men's 200m Freestyle Final",
                      time: "14:30",
                      status: "live",
                      participants: 8,
                      venue: "Pool A",
                    },
                    {
                      event: "Women's 100m Butterfly Semi",
                      time: "15:15",
                      status: "upcoming",
                      participants: 16,
                      venue: "Pool A",
                    },
                    {
                      event: "Mixed 4x100m Medley Relay",
                      time: "16:00",
                      status: "scheduled",
                      participants: 12,
                      venue: "Pool B",
                    },
                  ].map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{event.event}</div>
                        <div className="text-sm text-muted-foreground">
                          {event.time} • {event.venue} • {event.participants} participants
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            event.status === "live" ? "default" : event.status === "upcoming" ? "secondary" : "outline"
                          }
                        >
                          {event.status}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* User Management */}
              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>Monitor user engagement and registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { type: "Athletes", count: 156, active: 89 },
                      { type: "Officials", count: 45, active: 32 },
                      { type: "Spectators", count: 2234, active: 1456 },
                      { type: "Volunteers", count: 412, active: 298 },
                    ].map((userType, index) => (
                      <div key={index} className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{userType.count}</div>
                        <div className="text-sm text-muted-foreground">{userType.type}</div>
                        <div className="text-xs text-accent">{userType.active} active</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status & Analytics */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Daily Connections</span>
                      <span className="font-medium">2,847</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Notifications Sent</span>
                      <span className="font-medium">1,234</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Data Queries</span>
                      <span className="font-medium">15,678</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg. Session Time</span>
                      <span className="font-medium">12m 34s</span>
                    </div>
                  </div>
                  <Button className="w-full bg-transparent" variant="outline">
                    View Full Report
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { service: "Database", status: "operational" },
                    { service: "Notifications", status: "operational" },
                    { service: "Live Updates", status: "operational" },
                    { service: "File Storage", status: "maintenance" },
                  ].map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{service.service}</span>
                      <Badge variant={service.status === "operational" ? "default" : "secondary"}>
                        {service.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-transparent" variant="outline">
                    Send Notification
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline">
                    Export Data
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline">
                    System Backup
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
