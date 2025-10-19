import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { SecurityDashboard } from "@/components/security/security-dashboard"
import { IncidentReportForm } from "@/components/security/incident-report-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SecurityPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold">Security & Incident Management</h1>
              <p className="text-muted-foreground">
                Monitor security status and manage incidents across all championship venues
              </p>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList>
                <TabsTrigger value="dashboard">Security Dashboard</TabsTrigger>
                <TabsTrigger value="report">Report Incident</TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard">
                <SecurityDashboard />
              </TabsContent>

              <TabsContent value="report">
                <div className="max-w-2xl">
                  <IncidentReportForm />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
