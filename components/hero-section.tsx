import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Waves } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <Waves className="h-3 w-3 mr-1" />
                Live Event
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold text-balance">
                European Swimming Championships
                <span className="text-primary block">2026</span>
              </h1>
              <p className="text-xl text-muted-foreground text-pretty">
                The official platform for athletes, officials, spectators, and volunteers. Track events, view results,
                and stay connected in real-time.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Access Dashboard
              </Button>
              <Button variant="outline" size="lg">
                View Schedule
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">150+</div>
                <div className="text-sm text-muted-foreground">Athletes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">25</div>
                <div className="text-sm text-muted-foreground">Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">5</div>
                <div className="text-sm text-muted-foreground">Venues</div>
              </div>
            </div>
          </div>

          <Card className="p-6 bg-card/50 backdrop-blur">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Event Information</h3>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">March 15-22, 2026</div>
                    <div className="text-sm text-muted-foreground">8 days of competition</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">Paris, France</div>
                    <div className="text-sm text-muted-foreground">Centre Aquatique Olympique</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">32 Countries</div>
                    <div className="text-sm text-muted-foreground">Participating nations</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next Event</span>
                  <Badge variant="secondary">In 2 hours</Badge>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">Men's 200m Freestyle - Heats</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
