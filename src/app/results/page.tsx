import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { LiveResultsBoard } from "@/components/results/live-results-board"
import { ResultEntryForm } from "@/components/results/result-entry-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ResultsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold">Competition Results</h1>
              <p className="text-muted-foreground">
                Live results and rankings from the European Swimming Championships
              </p>
            </div>

            <Tabs defaultValue="results" className="space-y-6">
              <TabsList>
                <TabsTrigger value="results">Live Results</TabsTrigger>
                <TabsTrigger value="entry">Result Entry</TabsTrigger>
              </TabsList>

              <TabsContent value="results">
                <LiveResultsBoard />
              </TabsContent>

              <TabsContent value="entry">
                <div className="max-w-2xl">
                  <ResultEntryForm />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
