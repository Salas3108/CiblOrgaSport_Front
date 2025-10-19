import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Trophy, TrendingUp, User } from "lucide-react"

export default function AthletePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Athlete Profile Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                <User className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Léon Marchand</h1>
                <p className="text-muted-foreground">France • Individual Medley Specialist</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge>Competitor</Badge>
                  <Badge variant="secondary">4 Events</Badge>
                </div>
              </div>
            </div>
            <Button>View Full Profile</Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Schedule */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>My Schedule</span>
                  </CardTitle>
                  <CardDescription>Upcoming events and training sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      event: "200m Individual Medley",
                      stage: "Heats",
                      time: "10:30",
                      date: "Today",
                      venue: "Pool A",
                      status: "upcoming",
                    },
                    {
                      event: "200m Butterfly",
                      stage: "Heats",
                      time: "15:45",
                      date: "Today",
                      venue: "Pool A",
                      status: "upcoming",
                    },
                    {
                      event: "400m Individual Medley",
                      stage: "Heats",
                      time: "11:15",
                      date: "Tomorrow",
                      venue: "Pool A",
                      status: "scheduled",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{item.event}</div>
                        <div className="text-sm text-muted-foreground">{item.stage}</div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{item.time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{item.venue}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={item.status === "upcoming" ? "default" : "secondary"}>{item.date}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5" />
                    <span>Recent Results</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      event: "200m Freestyle",
                      time: "1:44.32",
                      position: 1,
                      date: "Yesterday",
                    },
                    {
                      event: "100m Butterfly",
                      time: "50.85",
                      position: 2,
                      date: "2 days ago",
                    },
                  ].map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{result.event}</div>
                        <div className="text-sm text-muted-foreground">{result.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-mono font-bold">{result.time}</div>
                        <Badge variant={result.position === 1 ? "default" : "secondary"}>
                          {result.position === 1 ? "🥇 1st" : result.position === 2 ? "🥈 2nd" : `${result.position}th`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Performance Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Personal Best</span>
                      <span className="font-mono">1:44.32</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Season Best</span>
                      <span className="font-mono">1:44.32</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>World Ranking</span>
                      <span className="font-medium">#3</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-transparent" variant="outline">
                    View Training Plan
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline">
                    Medical Check-in
                  </Button>
                  <Button className="w-full bg-transparent" variant="outline">
                    Contact Coach
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
