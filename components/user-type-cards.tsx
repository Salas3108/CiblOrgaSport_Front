import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, ClipboardCheck, Heart, Settings, Eye, ArrowRight } from "lucide-react"

const userTypes = [
  {
    id: "athlete",
    title: "Athletes",
    description: "Access your schedule, track performance, and view results",
    icon: Trophy,
    color: "bg-primary",
    features: ["Personal Schedule", "Performance Tracking", "Results & Rankings"],
    badge: "Competitor",
    href: "/athlete",
  },
  {
    id: "official",
    title: "Officials",
    description: "Manage competitions, validate results, and oversee events",
    icon: ClipboardCheck,
    color: "bg-accent",
    features: ["Event Management", "Result Validation", "Competition Control"],
    badge: "Staff",
    href: "/official",
  },
  {
    id: "spectator",
    title: "Spectators",
    description: "Follow events, get notifications, and find your way around",
    icon: Eye,
    color: "bg-chart-2",
    features: ["Live Updates", "Event Schedule", "Venue Maps"],
    badge: "Visitor",
    href: "/spectator",
  },
  {
    id: "volunteer",
    title: "Volunteers",
    description: "View assignments, receive updates, and coordinate tasks",
    icon: Heart,
    color: "bg-chart-4",
    features: ["Daily Tasks", "Team Communication", "Event Support"],
    badge: "Helper",
    href: "/volunteer",
  },
  {
    id: "admin",
    title: "Administrators",
    description: "Full event management, analytics, and system oversight",
    icon: Settings,
    color: "bg-chart-1",
    features: ["Event Creation", "User Management", "Analytics Dashboard"],
    badge: "Manager",
    href: "/admin",
  },
]

export function UserTypeCards() {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-balance">Choose Your Role</h2>
        <p className="text-muted-foreground text-pretty">
          Access the platform features designed specifically for your role in the championships
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userTypes.map((type) => {
          const IconComponent = type.icon
          return (
            <Card key={type.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`${type.color} p-3 rounded-lg text-white`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <Badge variant="secondary">{type.badge}</Badge>
                </div>
                <div>
                  <CardTitle className="text-xl">{type.title}</CardTitle>
                  <CardDescription className="text-pretty">{type.description}</CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {type.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-muted-foreground">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Access Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
