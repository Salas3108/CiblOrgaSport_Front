'use client';
import { Header } from "@/components/header"
import UserValidation from "@/src/components/admin/UserValidation"
import EventManagement from "@/src/components/admin/EventManagement"
import LieuManagement from "@/src/components/admin/LieuManagement"
import ListeAthletes from "@/src/components/admin/ListeAthletes"
import VolunteerProgramImport from "@/src/components/admin/VolunteerProgramImport"
import { useState } from "react"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'events' | 'lieux' | 'volunteer-programs'>('users');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Admin Header */}
          <div>
            <h1 className="text-3xl font-bold">Administration Dashboard</h1>
            <p className="text-muted-foreground">Gestion des utilisateurs, événements et lieux</p>
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
                onClick={() => setActiveTab('volunteer-programs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'volunteer-programs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Programmes volontaires
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
            {activeTab === 'volunteer-programs' && <VolunteerProgramImport />}
          </div>
        </div>
      </main>
    </div>
  )
}
