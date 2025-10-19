"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useNotifications } from "./notification-provider"
import { Bell, Volume2, Monitor, Trophy, Shield, Calendar, User, Settings } from "lucide-react"

export function NotificationPreferences() {
  const { preferences, updatePreferences } = useNotifications()

  const notificationTypes = [
    {
      key: "results" as const,
      label: "Competition Results",
      description: "Live results, medals, and rankings",
      icon: Trophy,
    },
    {
      key: "security" as const,
      label: "Security Alerts",
      description: "Safety updates and incident reports",
      icon: Shield,
    },
    {
      key: "events" as const,
      label: "Event Updates",
      description: "Schedule changes and event information",
      icon: Calendar,
    },
    {
      key: "personal" as const,
      label: "Personal Notifications",
      description: "Your schedule, tasks, and reminders",
      icon: User,
    },
    {
      key: "system" as const,
      label: "System Notifications",
      description: "App updates and maintenance alerts",
      icon: Settings,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Notification Preferences</span>
        </CardTitle>
        <CardDescription>Customize which notifications you receive and how you're alerted</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Notification Types</h4>
          {notificationTypes.map((type) => {
            const IconComponent = type.icon
            return (
              <div key={type.key} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-3">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor={type.key} className="text-sm font-medium">
                      {type.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                <Switch
                  id={type.key}
                  checked={preferences[type.key]}
                  onCheckedChange={(checked) => updatePreferences({ [type.key]: checked })}
                />
              </div>
            )
          })}
        </div>

        <Separator />

        {/* Delivery Methods */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Delivery Methods</h4>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="sound" className="text-sm font-medium">
                  Sound Alerts
                </Label>
                <p className="text-xs text-muted-foreground">Play sound when notifications arrive</p>
              </div>
            </div>
            <Switch
              id="sound"
              checked={preferences.sound}
              onCheckedChange={(checked) => updatePreferences({ sound: checked })}
            />
          </div>

          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-3">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="desktop" className="text-sm font-medium">
                  Desktop Notifications
                </Label>
                <p className="text-xs text-muted-foreground">Show notifications on your desktop</p>
              </div>
            </div>
            <Switch
              id="desktop"
              checked={preferences.desktop}
              onCheckedChange={(checked) => updatePreferences({ desktop: checked })}
            />
          </div>
        </div>

        <Separator />

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              updatePreferences({
                results: false,
                security: false,
                events: false,
                personal: false,
                system: false,
                sound: false,
                desktop: false,
              })
            }}
          >
            Disable All
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              updatePreferences({
                results: true,
                security: true,
                events: true,
                personal: true,
                system: true,
                sound: true,
                desktop: true,
              })
            }}
          >
            Enable All
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
