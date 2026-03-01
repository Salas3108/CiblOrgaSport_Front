"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getVolunteerTodayProgram, type VolunteerProgramTask } from "@/src/api/volunteerService"
import { Calendar, MapPin, Clock, RefreshCw } from "lucide-react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

const getAuthHeaders = () => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" }
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    : { "Content-Type": "application/json" }
}

export default function VolunteerPage() {
  const [volunteerId, setVolunteerId] = useState<number | null>(null)
  const [program, setProgram] = useState<VolunteerProgramTask[]>([])
  const [programLoading, setProgramLoading] = useState(false)
  const [programError, setProgramError] = useState<string | null>(null)

  // Recuperer l'ID numérique du volontaire depuis auth-service
  useEffect(() => {
    const fetchVolunteerId = async () => {
      try {
        if (typeof window === "undefined") return
        const stored = localStorage.getItem("user")
        if (!stored) return
        
        const parsed = JSON.parse(stored)
        const username = parsed.username || parsed.name || parsed.id
        if (!username) return

        // Appeler auth-service pour récupérer l'ID numérique
        const response = await fetch(`${API_BASE_URL}/auth/user/username/${username}`, {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          const id = Number(data.id)
          if (!isNaN(id)) {
            setVolunteerId(id)
          }
        }
      } catch (e) {
        console.error("Erreur lors de la récupération de l'ID volontaire:", e)
      }
    }

    fetchVolunteerId()
  }, [])

  // Charger le programme une fois qu'on a l'ID
  const loadProgram = async (id: number) => {
    setProgramLoading(true)
    setProgramError(null)
    try {
      const today = new Date().toISOString().slice(0, 10)
      console.log(`Chargement des tâches pour le volontaire ${id} à la date ${today}`)
      const data = await getVolunteerTodayProgram(id, today)
      console.log(`Tâches récupérées: ${data.length}`, data)
      setProgram(data)
    } catch (e: any) {
      console.error("Erreur:", e)
      setProgramError(e?.message || "Erreur lors du chargement du programme")
    } finally {
      setProgramLoading(false)
    }
  }

  useEffect(() => {
    if (volunteerId === null) return
    loadProgram(volunteerId)
    
    // Auto-refresh toutes les 30 secondes pour voir les nouvelles tâches ajoutées
    const interval = setInterval(() => loadProgram(volunteerId), 30000)
    
    return () => clearInterval(interval)
  }, [volunteerId])

  return (
    <ProtectedRoute allowedRoles={["volunteer"]}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Mes tâches</span>
                </CardTitle>
                <CardDescription>Toutes vos tâches assignées</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => volunteerId && loadProgram(volunteerId)}
                disabled={programLoading}
              >
                <RefreshCw className={`h-4 w-4 ${programLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {programError && <div className="text-sm text-red-600">{programError}</div>}

              {programLoading ? (
                <div className="text-sm text-muted-foreground">Chargement du programme...</div>
              ) : program.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Aucune tâche assignée.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    Total: <span className="font-bold text-foreground">{program.length} tâche(s)</span>
                  </div>
                  {(() => {
                    // Grouper les tâches par date
                    const tasksByDate = program.reduce((acc, task) => {
                      if (!acc[task.taskDate]) {
                        acc[task.taskDate] = []
                      }
                      acc[task.taskDate].push(task)
                      return acc
                    }, {} as Record<string, VolunteerProgramTask[]>)
                    
                    return Object.entries(tasksByDate).map(([date, tasks]) => (
                      <div key={date} className="space-y-2">
                        <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                          <Calendar className="h-4 w-4" />
                          <h3 className="font-semibold text-base">{date}</h3>
                          <Badge variant="secondary">{tasks.length} tâche(s)</Badge>
                        </div>
                        <div className="space-y-2 pl-2">
                          {tasks.map((task, index) => (
                            <div key={`task-${date}-${index}`} className="flex items-start space-x-4 p-4 border-2 rounded-lg bg-blue-50">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="font-bold text-lg">{task.role}</div>
                                  <Badge variant="outline">{task.location}</Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground pt-2">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-medium">{task.startTime} - {task.endTime}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-medium">{task.location}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  )
}
