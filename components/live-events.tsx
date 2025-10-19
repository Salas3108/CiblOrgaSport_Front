import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Users, Play, Trophy } from "lucide-react"

const liveEvents = [
  {
    id: 1,
    title: "Men's 200m Freestyle",
    stage: "Final",
    venue: "Centre Aquatique Olympique",
    time: "14:30",
    status: "live",
    participants: 8,
    leader: "Léon Marchand (FRA)",
    leadTime: "1:44.32",
  },
  {
    id: 2,
    title: "Women's 100m Butterfly",
    stage: "Semi-Final",
    venue: "Centre Aquatique Olympique",
    time: "15:15",
    status: "upcoming",
    participants: 16,
    leader: null,
    leadTime: null,
  },
  {
    id: 3,
    title: "Mixed 4x100m Medley Relay",
    stage: "Heats",
    venue: "Centre Aquatique Olympique",
    time: "16:00",
    status: "upcoming",
    participants: 12,
    leader: null,
    leadTime: null,
  },
]

const results = [
  {
    event: "Women's 50m Freestyle",
    winner: "Sarah Sjöström (SWE)",
    time: "23.85",
    record: "Championship Record",
  },
  {
    event: "Men's 100m Backstroke",
    winner: "Thomas Ceccon (ITA)",
    time: "51.12",
    record: null,
  },
]

export function LiveEvents() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Live Events & Results</h2>
          <p className="text-muted-foreground">Follow the action in real-time</p>
        </div>
        <Button variant="outline">View All Events</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-semibold">Current & Upcoming</h3>
          {liveEvents.map((event) => (
            <Card key={event.id} className={`${event.status === "live" ? "border-primary bg-primary/5" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge
                      variant={event.status === "live" ? "default" : "secondary"}
                      className={event.status === "live" ? "bg-primary" : ""}
                    >
                      {event.status === "live" && <Play className="h-3 w-3 mr-1" />}
                      {event.stage}
                    </Badge>
                  </div>
                  {event.status === "live" && (
                    <div className="flex items-center space-x-1 text-primary">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-sm font-medium">LIVE</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{event.participants} swimmers</span>
                  </div>
                  <div className="flex items-center space-x-2 col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.venue}</span>
                  </div>
                </div>

                {event.leader && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Leader</span>
                      <span className="text-sm font-mono">{event.leadTime}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{event.leader}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Latest Results</h3>
          {results.map((result, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{result.event}</span>
                  </div>
                  <div className="font-semibold">{result.winner}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-mono font-bold text-primary">{result.time}</span>
                    {result.record && (
                      <Badge variant="secondary" className="text-xs">
                        {result.record}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full bg-transparent">
            View All Results
          </Button>
        </div>
      </div>
    </section>
  )
}
