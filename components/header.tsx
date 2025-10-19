"use client"
import { Button } from "@/components/ui/button"
import { Menu, User, Calendar, Trophy, MapPin, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { NotificationCenter } from "@/components/notifications/notification-center"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const { user, logout, isAuthenticated } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">CiblOrgaSport</h1>
              <p className="text-xs text-muted-foreground">European Swimming Championships 2026</p>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Events</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-2" asChild>
            <a href="/results">
              <Trophy className="h-4 w-4" />
              <span>Results</span>
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="flex items-center space-x-2" asChild>
            <a href="/venues">
              <MapPin className="h-4 w-4" />
              <span>Venues</span>
            </a>
          </Button>
        </nav>

        <div className="flex items-center space-x-4">
          {isAuthenticated && <NotificationCenter />}

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" asChild>
              <a href="/login">Sign In</a>
            </Button>
          )}

          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
