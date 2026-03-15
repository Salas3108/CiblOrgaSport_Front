"use client"   // <-- must be a client component

import * as React from "react"
import { AuthProvider } from "@/components/auth/auth-provider"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { GeolocationProvider } from "@/components/maps/geolocation-provider"
import { ResultsProvider } from "@/components/results/results-provider"
import { SecurityProvider } from "@/components/security/security-provider"

/**
 * Wraps the various client‑only providers so that the layout can remain
 * a server component (and still export `metadata`).
 */
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <GeolocationProvider>
          <ResultsProvider>
            <SecurityProvider>{children}</SecurityProvider>
          </ResultsProvider>
        </GeolocationProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}
