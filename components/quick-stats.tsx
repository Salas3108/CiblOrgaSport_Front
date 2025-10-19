import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, Calendar, Trophy, MapPin, Bell } from "lucide-react"

const stats = [
  {
    title: "Active Users",
    value: "2,847",
    change: "+12%",
    trend: "up",
    icon: Users,
    description: "Currently online",
  },
  {
    title: "Events Today",
    value: "18",
    change: "6 completed",
    trend: "neutral",
    icon: Calendar,
    description: "Scheduled competitions",
  },
  {
    title: "Medals Awarded",
    value: "45",
    change: "+8 today",
    trend: "up",
    icon: Trophy,
    description: "Total championships",
  },
  {
    title: "Venues Active",
    value: "5",
    change: "All operational",
    trend: "neutral",
    icon: MapPin,
    description: "Competition sites",
  },
  {
    title: "Notifications Sent",
    value: "1,234",
    change: "+156 today",
    trend: "up",
    icon: Bell,
    description: "Real-time updates",
  },
  {
    title: "Records Broken",
    value: "3",
    change: "2 championship",
    trend: "up",
    icon: TrendingUp,
    description: "New achievements",
  },
]

export function QuickStats() {
  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Championship Statistics</h2>
        <p className="text-muted-foreground">Real-time insights from the European Swimming Championships 2026</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                    <Badge
                      variant={stat.trend === "up" ? "default" : "secondary"}
                      className={stat.trend === "up" ? "bg-accent" : ""}
                    >
                      {stat.change}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
