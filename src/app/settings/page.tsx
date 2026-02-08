import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { NotificationPreferences } from "@/components/notifications/notification-preferences"

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Manage your account and notification preferences</p>
            </div>

            <div className="max-w-2xl">
              <NotificationPreferences />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
