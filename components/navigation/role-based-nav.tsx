"use client"

import { Button } from "@/components/ui/button"
import { 
  Calendar, 
  Trophy, 
  MapPin, 
  Shield, 
  Users, 
  ClipboardCheck, 
  Heart, 
  Eye,
  Settings,
  BarChart3
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import Link from "next/link"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: string[]
}

const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: BarChart3,
    roles: ["official", "athlete", "spectator", "volunteer"]
  },
  {
    label: "Events",
    href: "/AdminEvents",
    icon: Calendar,
    roles: ["official", "athlete", "spectator", "volunteer"]
  },
  {
    label: "Results",
    href: "/results",
    icon: Trophy,
    roles: ["admin", "official", "athlete", "spectator", "volunteer"]
  },
  {
    label: "Venues",
    href: "/venues",
    icon: MapPin,
    roles: ["admin", "official", "spectator", "volunteer"]
  },
  {
    label: "Security",
    href: "/security",
    icon: Shield,
    roles: ["admin", "official", "volunteer"]
  },
  {
    label: "Administration",
    href: "/admin",
    icon: Settings,
    roles: ["admin"]
  },
  {
    label: "Athletes",
    href: "/athlete",
    icon: Users,
    roles: ["athlete"]
  },
  {
    label: "Mes épreuves",
    href: "/athlete/mes-epreuves",
    icon: Calendar,
    roles: ["athlete"]
  },
  {
    label: "Mon équipe",
    href: "/athlete/mon-equipe",
    icon: Users,
    roles: ["athlete"]
  },
  {
    label: "Officials",
    href: "/official",
    icon: ClipboardCheck,
    roles: ["official"]
  },
  {
    label: "Validation athlètes",
    href: "/commissaire",
    icon: ClipboardCheck,
    roles: ["commissaire"]
  },
  {
    label: "Assignation équipes",
    href: "/commissaire/equipes",
    icon: Users,
    roles: ["commissaire"]
  },
  {
    label: "Volunteers",
    href: "/volunteer",
    icon: Heart,
    roles: ["volunteer"]
  },
  {
    label: "Spectators",
    href: "/spectator",
    icon: Eye,
    roles: ["spectator"]
  }
]

export function RoleBasedNav() {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return (
      <nav className="hidden md:flex items-center space-x-6">
        <Button variant="ghost" size="sm" className="flex items-center space-x-2" asChild>
          <Link href="/AdminEvents">
            <Calendar className="h-4 w-4" />
            <span>Events</span>
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2" asChild>
          <Link href="/results">
            <Trophy className="h-4 w-4" />
            <span>Results</span>
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="flex items-center space-x-2" asChild>
          <Link href="/venues">
            <MapPin className="h-4 w-4" />
            <span>Venues</span>
          </Link>
        </Button>
      </nav>
    )
  }

  const userRole = user.role
  // Normalize role: accept backend enum (USER, ADMIN, VOLONTAIRE...) or UI keys
  const BACKEND_TO_UI_ROLE: Record<string, string> = {
    USER: "spectator",
    ROLE_USER: "spectator",
    ATHLETE: "athlete",
    ROLE_ATHLETE: "athlete",
    ADMIN: "admin",
    ROLE_ADMIN: "admin",
    COMMISSAIRE: "commissaire",
    ROLE_COMMISSAIRE: "commissaire",
    VOLONTAIRE: "volunteer",
    ROLE_VOLONTAIRE: "volunteer",
  }

  const rawRole = (userRole || "").toString()
  let normalizedRole = rawRole
  const upper = rawRole.toUpperCase()
  if (BACKEND_TO_UI_ROLE[upper]) {
    normalizedRole = BACKEND_TO_UI_ROLE[upper]
  } else {
    normalizedRole = rawRole.toLowerCase()
  }

  const allowedItems = navigationItems.filter((item) =>
    item.roles.includes(normalizedRole) || item.roles.includes("all")
  )

  return (
    <nav className="hidden md:flex items-center space-x-6">
      {allowedItems.map((item) => {
        const IconComponent = item.icon
        return (
          <Button 
            key={item.href} 
            variant="ghost" 
            size="sm" 
            className="flex items-center space-x-2" 
            asChild
          >
            <Link href={item.href}>
              <IconComponent className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          </Button>
        )
      })}
    </nav>
  )
}
