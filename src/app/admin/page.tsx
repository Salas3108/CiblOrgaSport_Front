'use client';
import UserValidation from "@/src/components/admin/UserValidation"
import EventManagement from "@/src/components/admin/EventManagement"
import LieuManagement from "@/src/components/admin/LieuManagement"
import CompetitionManagement from "@/src/components/admin/CompetitionManagement"
import EpreuveManagement from "@/src/components/admin/EpreuveManagement"
import VolunteerProgramImport from "@/src/components/admin/VolunteerProgramImport"
import { Users } from "lucide-react"
import { useState } from "react"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'events' | 'lieux' | 'competitions' | 'epreuves' | 'volunteers'>('users');

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Admin Header */}
          <div>
            <h1 className="text-3xl font-bold">Administration Dashboard</h1>
            <p className="text-muted-foreground">Gestion des utilisateurs, événements, lieux et volontaires</p>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Validation des Utilisateurs
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Gestion des Événements
              </button>
              <button
                onClick={() => setActiveTab('lieux')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'lieux'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Gestion des Lieux
              </button>
              <button
                onClick={() => setActiveTab('competitions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'competitions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Compétitions
              </button>
              <button
                onClick={() => setActiveTab('epreuves')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'epreuves'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Épreuves
              </button>
              <button
                onClick={() => setActiveTab('volunteers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'volunteers'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-4 w-4" />
                Gestion des Volontaires
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'users' && (
              <div className="mt-8">
                <UserValidation />
              </div>
            )}
            {activeTab === 'events' && <EventManagement />}
            {activeTab === 'lieux' && <LieuManagement />}
            {activeTab === 'competitions' && <CompetitionManagement />}
            {activeTab === 'epreuves' && <EpreuveManagement />}
            {activeTab === 'volunteers' && <VolunteerProgramImport />}
          </div>
        </div>
      </main>
    </div>
  )
}
