"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar, Trophy, Shield, Users, ClipboardCheck,
  Eye, Settings, BarChart3, Map, Navigation, Home, User
} from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  // ── Commun ──
  { label: "Accueil",           href: "/",                            icon: Home,           roles: ["admin", "official", "athlete", "spectator", "volunteer", "commissaire"] },
  { label: "Événements",        href: "/AdminEvents",                 icon: Calendar,       roles: ["official", "spectator", "volunteer"] },
  { label: "Résultats",         href: "/results",                     icon: Trophy,         roles: ["admin", "official", "athlete", "spectator", "volunteer"] },
  { label: "Vie privée",        href: "/vie-privee",                  icon: Users,          roles: ["admin", "official", "athlete", "spectator", "volunteer", "commissaire"] },
  { label: "Sécurité",          href: "/security",                    icon: Shield,         roles: ["admin", "official", "volunteer"] },

  // ── Admin ──
  { label: "Administration",    href: "/admin",                       icon: Settings,       roles: ["admin"] },
  { label: "Fan Zones",         href: "/admin/fanzones",              icon: Map,            roles: ["admin"] },
  { label: "Carte athlètes",    href: "/admin/athletes/carte",        icon: Navigation,     roles: ["admin"] },
  { label: "Analytics",         href: "/admin/analytics",             icon: BarChart3,      roles: ["admin"] },

  // ── Commissaire ──
  { label: "Validation",        href: "/commissaire",                 icon: ClipboardCheck, roles: ["commissaire"] },
  { label: "Équipes",           href: "/commissaire/equipes",         icon: Users,          roles: ["commissaire"] },
  { label: "Épreuves",          href: "/commissaire/epreuves",        icon: Trophy,         roles: ["commissaire"] },
  { label: "Carte athlètes",    href: "/commissaire/athletes/carte",  icon: Map,            roles: ["commissaire"] },

  // ── Athlète ──
  { label: "Compléter profil",  href: "/athlete",                     icon: User,           roles: ["athlete"] },
  { label: "Mes épreuves",      href: "/athlete/mes-epreuves",        icon: Calendar,       roles: ["athlete"] },
  { label: "Mon équipe",        href: "/athlete/mon-equipe",          icon: Users,          roles: ["athlete"] },

  // ── Volontaire ──
  { label: "Compléter profil",  href: "/volunteer/profile",           icon: Users,          roles: ["volunteer"] },
  { label: "Mon programme",     href: "/volunteer/program",           icon: Calendar,       roles: ["volunteer"] },

  // ── Spectateur ──
  { label: "Spectateurs",       href: "/spectator",                   icon: Eye,            roles: ["spectator"] },

  // ── Géolocalisation ──
  { label: "Fan Zones",         href: "/fanzones",                    icon: Navigation,     roles: ["spectator", "athlete", "volunteer"] },
]

const BACKEND_TO_UI: Record<string, string> = {
  USER: "spectator",      ROLE_USER: "spectator",
  ATHLETE: "athlete",     ROLE_ATHLETE: "athlete",
  ADMIN: "admin",         ROLE_ADMIN: "admin",
  COMMISSAIRE: "commissaire", ROLE_COMMISSAIRE: "commissaire",
  VOLONTAIRE: "volunteer",    ROLE_VOLONTAIRE: "volunteer",
}

function normalizeRole(role?: string): string {
  if (!role) return ""
  return BACKEND_TO_UI[role.toUpperCase()] ?? role.toLowerCase()
}

interface RoleBasedNavProps {
  mobile?: boolean
  onClose?: () => void
}

export function RoleBasedNav({ mobile = false, onClose }: RoleBasedNavProps) {
  const { user, isAuthenticated } = useAuth()
  const pathname = usePathname()

  const role = normalizeRole(user?.role)

  const items = isAuthenticated && user
    ? NAV_ITEMS.filter((item) => item.roles.includes(role))
    : [
        { label: "Événements", href: "/AdminEvents", icon: Calendar },
        { label: "Résultats",  href: "/results",     icon: Trophy },
        { label: "Fan Zones",  href: "/fanzones",    icon: Navigation },
      ]

  if (mobile) {
    return (
      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-white/20 text-white font-semibold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="hidden md:flex items-center gap-0.5">
      {items.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              active
                ? "bg-white/20 text-white font-semibold"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
