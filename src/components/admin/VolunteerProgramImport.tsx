"use client"

import { useEffect, useState } from "react"
import { getVolunteers, importVolunteerPrograms, getAllVolunteerTasks, type VolunteerListItem, type VolunteerProgramTask } from "@/src/api/volunteerService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Calendar, RefreshCw } from "lucide-react"

const emptyTask = (): VolunteerProgramTask => ({
  volunteerId: 0,
  volunteerName: "",
  taskDate: new Date().toISOString().slice(0, 10),
  startTime: "09:00:00",
  endTime: "12:00:00",
  location: "",
  role: "",
})

export default function VolunteerProgramImport() {
  const [draft, setDraft] = useState<VolunteerProgramTask>(emptyTask)
  const [volunteers, setVolunteers] = useState<VolunteerListItem[]>([])
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("")
  const [volunteersLoading, setVolunteersLoading] = useState(false)
  const [volunteersError, setVolunteersError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [allTasks, setAllTasks] = useState<VolunteerProgramTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [expandedVolunteers, setExpandedVolunteers] = useState<Set<number>>(new Set())

  useEffect(() => {
    const loadVolunteers = async () => {
      setVolunteersLoading(true)
      setVolunteersError(null)
      try {
        const data = await getVolunteers()
        setVolunteers(data)
      } catch (e: any) {
        setVolunteersError(e?.message || "Erreur lors du chargement des volontaires")
      } finally {
        setVolunteersLoading(false)
      }
    }

    loadVolunteers()
    loadAllTasks()
  }, [])

  const loadAllTasks = async () => {
    setTasksLoading(true)
    try {
      const data = await getAllVolunteerTasks()
      setAllTasks(data)
    } catch (e: any) {
      console.error("Erreur lors du chargement des tâches:", e)
    } finally {
      setTasksLoading(false)
    }
  }

  const addTask = async () => {
    setError(null)
    setSuccess(null)
    if (!draft.volunteerId || !draft.volunteerName || !draft.taskDate || !draft.startTime || !draft.endTime || !draft.location || !draft.role) {
      setError("Veuillez remplir tous les champs.")
      return
    }
    
    setLoading(true)
    try {
      await importVolunteerPrograms([draft])
      setSuccess(`Tache ajoutee pour ${draft.volunteerName} - disponible immediatement.`)
      setDraft(emptyTask)
      setSelectedVolunteerId("")
      // Recharger les tâches après l'ajout
      loadAllTasks()
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'ajout de la tache.")
    } finally {
      setLoading(false)
    }
  }

  // Grouper les tâches par volontaire - uniquement les vrais volontaires
  const volunteerIds = new Set(volunteers.map(v => v.id))
  const filteredTasks = allTasks.filter(task => volunteerIds.has(task.volunteerId))
  
  const tasksByVolunteer = filteredTasks.reduce((acc, task) => {
    if (!acc[task.volunteerId]) {
      acc[task.volunteerId] = {
        volunteerName: task.volunteerName,
        tasks: []
      }
    }
    acc[task.volunteerId].tasks.push(task)
    return acc
  }, {} as Record<number, { volunteerName: string, tasks: VolunteerProgramTask[] }>)

    const toggleVolunteer = (volunteerId: number) => {
      const newExpanded = new Set(expandedVolunteers)
      if (newExpanded.has(volunteerId)) {
        newExpanded.delete(volunteerId)
      } else {
        newExpanded.add(volunteerId)
      }
      setExpandedVolunteers(newExpanded)
    }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Programmes volontaires</CardTitle>
          <CardDescription>Ajouter les taches - disponibles immediatement pour le volontaire. Vous pouvez ajouter plusieurs taches au meme volontaire.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Volontaire</Label>
            <Select
              value={selectedVolunteerId}
              onValueChange={(value) => {
                setSelectedVolunteerId(value)
                const found = volunteers.find((volunteer) => String(volunteer.id) === value)
                if (found) {
                  setDraft((prev) => ({
                    ...prev,
                    volunteerId: found.id,
                    volunteerName: found.username,
                  }))
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={volunteersLoading ? "Chargement..." : "Choisir un volontaire"} />
              </SelectTrigger>
              <SelectContent>
                {volunteers.map((volunteer) => (
                  <SelectItem key={volunteer.id} value={String(volunteer.id)}>
                    {volunteer.username}{volunteer.email ? ` (${volunteer.email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {volunteersError && <div className="text-sm text-red-600">{volunteersError}</div>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-date">Date</Label>
            <Input
              id="task-date"
              type="date"
              value={draft.taskDate}
              onChange={(e) => setDraft((prev) => ({ ...prev, taskDate: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start-time">Heure debut</Label>
            <Input
              id="start-time"
              type="time"
              step={1}
              value={draft.startTime}
              onChange={(e) => setDraft((prev) => ({ ...prev, startTime: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">Heure fin</Label>
            <Input
              id="end-time"
              type="time"
              step={1}
              value={draft.endTime}
              onChange={(e) => setDraft((prev) => ({ ...prev, endTime: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Lieu</Label>
            <Input
              id="location"
              value={draft.location}
              onChange={(e) => setDraft((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Ex: Site A"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={draft.role}
              onChange={(e) => setDraft((prev) => ({ ...prev, role: e.target.value }))}
              placeholder="Ex: Accueil"
            />
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-700">{success}</div>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={addTask} disabled={loading}>
            {loading ? "Ajout en cours..." : "Ajouter la tache"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDraft(emptyTask)
              setSelectedVolunteerId("")
            }}
            disabled={loading}
          >
            Reinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Récapitulatif des tâches par volontaire */}
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Récapitulatif des tâches</CardTitle>
          <CardDescription>Toutes les tâches assignées par volontaire</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={loadAllTasks}
          disabled={tasksLoading}
        >
          <RefreshCw className={`h-4 w-4 ${tasksLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {tasksLoading ? (
          <div className="text-sm text-muted-foreground">Chargement des tâches...</div>
        ) : Object.keys(tasksByVolunteer).length === 0 ? (
          <div className="text-sm text-muted-foreground">Aucune tâche assignée pour le moment.</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(tasksByVolunteer).map(([volunteerId, data]) => (
              <div key={volunteerId} className="border rounded-lg p-4 bg-muted/20">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/40 -m-4 p-4 rounded-lg transition-colors"
                    onClick={() => toggleVolunteer(Number(volunteerId))}
                  >
                  <h3 className="font-bold text-lg">{data.volunteerName}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{data.tasks.length} tâche(s)</Badge>
                      <Button variant="ghost" size="sm">
                        {expandedVolunteers.has(Number(volunteerId)) ? "Masquer" : "Voir les tâches"}
                      </Button>
                    </div>
                </div>
                  {expandedVolunteers.has(Number(volunteerId)) && (
                  <div className="space-y-2 mt-4">
                  {data.tasks
                    .sort((a, b) => {
                      const dateCompare = a.taskDate.localeCompare(b.taskDate)
                      if (dateCompare !== 0) return dateCompare
                      return a.startTime.localeCompare(b.startTime)
                    })
                    .map((task, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 border rounded bg-background">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{task.taskDate}</span>
                          <Badge variant="outline">{task.role}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground pl-6">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{task.startTime} - {task.endTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{task.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
  )
}
