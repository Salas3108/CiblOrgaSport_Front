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
import { SessionProvider } from "next-auth/react"
import "./globals.css"
import ClientProviders from "@/components/providers/client-providers"
import { Header } from "@/components/header"

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
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} flex flex-col min-h-screen`}>
        <SessionProvider>
          <AuthProvider>
            <NotificationProvider>
              <GeolocationProvider>
                <ResultsProvider>
                  <SecurityProvider>
                    <Suspense fallback={null}>
                      <ClientProviders>
                        <Header />
                        <main className="flex-1 flex flex-col">
                          {children}
                        </main>
                      </ClientProviders>
                    </Suspense>
                  </SecurityProvider>
                </ResultsProvider>
              </GeolocationProvider>
            </NotificationProvider>
          </AuthProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
