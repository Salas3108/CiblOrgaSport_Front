import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/components/auth/auth-provider"
import { NotificationProvider } from "@/components/notifications/notification-provider"
import { GeolocationProvider } from "@/components/maps/geolocation-provider"
import { ResultsProvider } from "@/components/results/results-provider"
import { SecurityProvider } from "@/components/security/security-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "CiblOrgaSport - European Swimming Championships 2026",
  description: "Official event management platform for European Swimming Championships 2026",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <NotificationProvider>
            <GeolocationProvider>
              <ResultsProvider>
                <SecurityProvider>
                  <Suspense fallback={null}>{children}</Suspense>
                </SecurityProvider>
              </ResultsProvider>
            </GeolocationProvider>
          </NotificationProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
