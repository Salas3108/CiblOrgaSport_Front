import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { UserTypeCards } from "@/components/user-type-cards"
import { LiveEvents } from "@/components/live-events"
import { QuickStats } from "@/components/quick-stats"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <div className="container mx-auto px-4 py-8 space-y-12">
          <UserTypeCards />
          <LiveEvents />
          <QuickStats />
        </div>
      </main>
    </div>
  )
}
