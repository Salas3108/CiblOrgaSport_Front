"use client"

import { useEffect, useState } from "react"
import { 
  getVolunteers, 
  createVolunteerTask,
  importVolunteerTasks,
  getAllVolunteerTasks, 
  assignVolunteerToTask,
  unassignVolunteerFromTask,
  findSuitableVolunteers,
  findVolunteersWithMatchInfo,
  updateVolunteerTask,
  deleteVolunteerTask,
  type VolunteerListItem,
  type VolunteerMatchInfo,
  type VolunteerTask 
} from "@/src/api/volunteerService"
import { Button } from "@/components/ui/button"
import { getLieux } from "@/src/api/eventsService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectItem } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Calendar, RefreshCw, Trash2, User, Upload, Edit2, Plus, Users, Download, Globe, AlertTriangle, FileText } from "lucide-react"

// Mapping des types de tâches du backend avec descriptions et paramètres par défaut
interface TaskTemplate {
  id: string
  description: string
  defaultDuration: number // en heures
  requiredSkills?: string[]
  requiredLanguages?: string[]
}

// Fonction pour convertir enum en texte lisible (ex: ACCUEIL -> "Accueil")
const formatTaskTypeName = (taskType: string): string => {
  return taskType
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

const TASK_TEMPLATES: Record<string, TaskTemplate> = {
  ACCUEIL: {
    id: "ACCUEIL",
    description: "Accueil, enregistrement et orientation des participants à l'événement",
    defaultDuration: 4,
    requiredSkills: ["Communication", "Organisation"],
    requiredLanguages: ["Français", "Anglais", "Espagnol"],
  },
  ORIENTATION: {
    id: "ORIENTATION",
    description: "Orientation et guidage des participants sur le site",
    defaultDuration: 4,
    requiredSkills: ["Communication"],
    requiredLanguages: ["Français", "Anglais", "Allemand"],
  },
  SUPPORT_LOGISTIQUE: {
    id: "SUPPORT_LOGISTIQUE",
    description: "Support logistique et mise en place du matériel",
    defaultDuration: 6,
    requiredSkills: ["Organisation"],
    requiredLanguages: ["Français"],
  },
  SECURITE: {
    id: "SECURITE",
    description: "Surveillance, contrôle d'accès et gestion de la sécurité",
    defaultDuration: 6,
    requiredLanguages: ["Français", "Anglais"],
  },
  PREMIERS_SECOURS: {
    id: "PREMIERS_SECOURS",
    description: "Premiers secours et assistance médicale",
    defaultDuration: 8,
    requiredSkills: ["Formation PSC/Médical"],
    requiredLanguages: ["Français", "Anglais"],
  },
  ACCOMPAGNEMENT_ATHLETES: {
    id: "ACCOMPAGNEMENT_ATHLETES",
    description: "Accompagnement et assistance des athlètes",
    defaultDuration: 6,
    requiredSkills: ["Disponibilité", "Pédagogie"],
    requiredLanguages: ["Français", "Anglais"],
  },
  DISTRIBUTION_EAU: {
    id: "DISTRIBUTION_EAU",
    description: "Distribution de boissons aux participants et athlètes",
    defaultDuration: 4,
    requiredSkills: ["Hygiène"],
    requiredLanguages: ["Français"],
  },
  NETTOYAGE: {
    id: "NETTOYAGE",
    description: "Maintien de la propreté et de l'hygiène du site",
    defaultDuration: 8,
    requiredSkills: ["Responsabilité"],
    requiredLanguages: ["Français"],
  },
  BILLETTERIE: {
    id: "BILLETTERIE",
    description: "Vente et contrôle des billets à l'entrée",
    defaultDuration: 8,
    requiredSkills: ["Communication", "Gestion"],
    requiredLanguages: ["Français", "Anglais", "Espagnol"],
  },
  INFORMATION: {
    id: "INFORMATION",
    description: "Accueil et information aux points d'information",
    defaultDuration: 4,
    requiredSkills: ["Communication"],
    requiredLanguages: ["Français", "Anglais", "Allemand"],
  },
  AUTRE: {
    id: "AUTRE",
    description: "Créer une tâche personnalisée",
    defaultDuration: 4,
  },
}

function VolunteerProgramImport() {
  const emptyTask = (): Omit<VolunteerTask, "id" | "status" | "assignedTo"> => ({
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "09:00:00",
    endTime: "12:00:00",
    locationId: 0,
    requiredSkills: [],
    requiredLanguages: [],
  })

  const [draft, setDraft] = useState<Omit<VolunteerTask, "id" | "status" | "assignedTo">>(emptyTask)
  const [lieux, setLieux] = useState<{ idLieu: string; nomLieu: string }[]>([])
  const [lieuxError, setLieuxError] = useState<string | null>(null)
  const [lieuxLoading, setLieuxLoading] = useState(true)
  useEffect(() => {
    setLieuxLoading(true)
    getLieux().then((data) => {
      if (Array.isArray(data)) {
        // Map backend fields to frontend expected fields
        const mapped = data.map((lieu: any) => ({
          idLieu: lieu.id?.toString() ?? '',
          nomLieu: lieu.nom ?? '',
          ville: lieu.ville,
          adresse: lieu.adresse,
          typeLieu: lieu.typeLieu,
          coordonneesGPS: lieu.coordonneesGPS,
        }))
        setLieux(mapped)
        setLieuxError(null)
      } else {
        setLieux([])
        setLieuxError('Le backend a répondu mais le format n\'est pas un tableau.')
      }
    }).catch((err) => {
      setLieux([])
      setLieuxError('Erreur lors du chargement des lieux: ' + (err?.message || String(err)))
    }).finally(() => {
      setLieuxLoading(false)
    })
  }, [])
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom") // État pour la tâche prédéfinie sélectionnée
  const [taskType, setTaskType] = useState<"ACCUEIL" | "ORIENTATION" | "SUPPORT_LOGISTIQUE" | "SECURITE" | "PREMIERS_SECOURS" | "ACCOMPAGNEMENT_ATHLETES" | "DISTRIBUTION_EAU" | "NETTOYAGE" | "BILLETTERIE" | "INFORMATION" | "AUTRE">("ACCUEIL") // État typé pour le type de tâche
  const [volunteers, setVolunteers] = useState<VolunteerListItem[]>([])
  const [volunteersLoading, setVolunteersLoading] = useState(false)
  const [volunteersError, setVolunteersError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const [assignmentSuccess, setAssignmentSuccess] = useState<string | null>(null)
  const [allTasks, setAllTasks] = useState<VolunteerTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [expandedVolunteers, setExpandedVolunteers] = useState<Set<string>>(new Set())
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<string | null>(null)
  const [suitableVolunteers, setSuitableVolunteers] = useState<VolunteerMatchInfo[]>([])
  const [isVolunteerFallback, setIsVolunteerFallback] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'import' | 'manage'>('create')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<VolunteerTask> | null>(null)
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null)

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
    if (!draft.title || !draft.date || !draft.startTime || !draft.endTime || !draft.locationId || draft.locationId === 0) {
      setError("Veuillez remplir tous les champs obligatoires, y compris le lieu.")
      return
    }
    
    setLoading(true)
    try {
      // Transform frontend data to backend VolunteerTaskDTO format
      const taskData = {
        title: draft.title,
        description: draft.description || "",
        taskDate: draft.date, // date format: YYYY-MM-DD
        startTime: draft.startTime.includes(":") ? draft.startTime : `${draft.startTime}:00`,
        endTime: draft.endTime.includes(":") ? draft.endTime : `${draft.endTime}:00`,
        locationId: Number(draft.locationId),
        taskType: taskType, // Utiliser l'état taskType stocké
        volunteersNeeded: (draft as any).volunteersNeeded || 1,
        eventId: "00000000-0000-0000-0000-000000000000", // Placeholder UUID - update if needed
        requiredLanguages: draft.requiredLanguages || [], // Ajouter les langues requises
      }
      await createVolunteerTask(taskData)
      setSuccess(`Tâche "${draft.title}" créée avec succès.`)
      setDraft(emptyTask())
      // Recharger les tâches après l'ajout
      loadAllTasks()
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'ajout de la tâche.")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    
    if (templateId === "custom") {
      // Option "Autre" - remet le formulaire à zéro
      setDraft(emptyTask())
      setTaskType("ACCUEIL") // Réinitialiser à la valeur par défaut
    } else {
      // Trouver le template et remplir le formulaire
      const template = TASK_TEMPLATES[templateId as keyof typeof TASK_TEMPLATES]
      if (template) {
        const endTime = new Date()
        endTime.setHours(9 + template.defaultDuration)
        
        setDraft({
          title: formatTaskTypeName(template.id),
          description: template.description,
          date: new Date().toISOString().slice(0, 10),
          startTime: "09:00:00",
          endTime: `${String(endTime.getHours()).padStart(2, "0")}:00:00`,
          location: "",
          requiredSkills: template.requiredSkills || [],
          requiredLanguages: template.requiredLanguages || [],
        })
        
        // Stocker le taskType depuis le template sélectionné
        if (templateId in TASK_TEMPLATES) {
          setTaskType(templateId as keyof typeof TASK_TEMPLATES as any)
        }
      }
    }
  }

  const handleAssignVolunteer = async (
    taskId: string,
    volunteerId: string
  ): Promise<{ assigned: boolean; errorMessage?: string }> => {
    setAssignmentError(null)
    setAssignmentSuccess(null)
    try {
      await assignVolunteerToTask(taskId, volunteerId)
      setAssignmentSuccess("Volontaire assigné avec succès")
      loadAllTasks()
      return { assigned: true }
    } catch (e: any) {
      const message = e?.message || "Erreur lors de l'assignation du volontaire"
      setAssignmentError(message)
      return { assigned: false, errorMessage: message }
    }
  }

  const handleUnassignVolunteer = async (taskId: string, volunteerId: string) => {
    setError(null)
    try {
      await unassignVolunteerFromTask(taskId, volunteerId)
      setSuccess("Volontaire désassigné avec succès")
      loadAllTasks()
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la désassignation")
    }
  }

  const handleEditTask = (task: VolunteerTask) => {
    setEditingTaskId(task.id)
    // Assurer que requiredLanguages est un tableau, même s'il n'existe pas dans la tâche
    setEditFormData({ 
      ...task,
      requiredLanguages: task.requiredLanguages || []
    })
    setError(null)
  }

  const handleSaveEdit = async () => {
    setError(null)
    if (!editingTaskId || !editFormData) return

    if (!editFormData.title?.trim() || !editFormData.date || !editFormData.startTime || !editFormData.endTime || !editFormData.locationId || editFormData.locationId === 0) {
      setError("Veuillez remplir tous les champs obligatoires, y compris le lieu.")
      return
    }

    setLoading(true)
    try {
      // Find original task to get taskType and volunteersNeeded
      const originalTask = allTasks.find(t => t.id === editingTaskId)
      
      // Prepare task data with all fields from originalTask to preserve backend data
      const updatedTask = {
        title: editFormData.title,
        description: editFormData.description || "",
        date: editFormData.date, // Use 'date' field for frontend compatibility
        startTime: editFormData.startTime,
        endTime: editFormData.endTime,
        locationId: Number(editFormData.locationId),
        taskType: (originalTask as any)?.taskType || "ACCUEIL",
        volunteersNeeded: (originalTask as any)?.volunteersNeeded || 1,
        eventId: (originalTask as any)?.eventId || "00000000-0000-0000-0000-000000000000",
        requiredLanguages: editFormData.requiredLanguages || [],
        requiredSkills: (originalTask as any)?.requiredSkills || [],
      }
      await updateVolunteerTask(editingTaskId, updatedTask)
      setSuccess("Tâche modifiée avec succès")
      setEditingTaskId(null)
      setEditFormData(null)
      loadAllTasks()
    } catch (e: any) {
      console.error("Update error:", e)
      setError(e?.message || "Erreur lors de la modification de la tâche")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    setError(null)
    setLoading(true)
    try {
      await deleteVolunteerTask(taskId)
      setSuccess("Tâche supprimée avec succès")
      setDeleteConfirmTaskId(null)
      loadAllTasks()
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la suppression de la tâche")
    } finally {
      setLoading(false)
    }
  }

  const handleFindSuitableVolunteers = async (taskId: string) => {
    setError(null)
    setAssignmentError(null)
    setAssignmentSuccess(null)
    try {
      // Utiliser le nouvel endpoint qui retourne les informations de correspondance
      const matchInfo = await findVolunteersWithMatchInfo(taskId)

      setSuitableVolunteers(matchInfo)
      setIsVolunteerFallback(false)
      setSelectedTaskForAssignment(taskId)
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la recherche de volontaires adaptés")
    }
  }

  const handleImportTasksFile = async (file: File) => {
    setError(null)
    setSuccess(null)
    try {
      const content = await file.text()
      const tasks = JSON.parse(content)
      
      if (!Array.isArray(tasks)) {
        setError("Le fichier doit contenir un tableau JSON de tâches")
        return
      }

      setLoading(true)
        await importVolunteerTasks(tasks)
      setSuccess(`${tasks.length} tâche(s) importée(s) avec succès!`)
      loadAllTasks()
    } catch (e: any) {
      setError(e?.message || "Erreur lors de l'import du fichier")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="border-b">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus className="inline mr-1 h-4 w-4 align-text-bottom" />Créer une tâche
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'import'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Download className="inline mr-1 h-4 w-4 align-text-bottom" />Importer des tâches
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'manage'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="inline mr-1 h-4 w-4 align-text-bottom" />Assigner les tâches
          </button>
        </nav>
      </div>

      {/* Create Tab */}
      {activeTab === 'create' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-900">Créer une nouvelle tâche</CardTitle>
            <CardDescription>Ajouter une tâche unitaire pour les volontaires</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="task-template" className="font-semibold text-slate-800">Sélectionner une tâche prédéfinie</Label>
                <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
                  <SelectTrigger id="task-template">
                    <SelectValue placeholder="Choisir une tâche ou créer une autre..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Autre (création personnalisée)</SelectItem>
                    {Object.entries(TASK_TEMPLATES)
                      .filter(([_, template]) => template.id !== "AUTRE")
                      .map(([_, template]) => (
                        <SelectItem key={template.id} value={template.id}>
                          {formatTaskTypeName(template.id)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="task-title" className="font-semibold text-slate-800">Titre de la tâche *</Label>
                <Input
                  id="task-title"
                  value={draft.title}
                  onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Accueil des participants"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="task-description" className="font-semibold text-slate-800">Description</Label>
                <Input
                  id="task-description"
                  value={draft.description || ""}
                  onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Description détaillée de la tâche"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-date" className="font-semibold text-slate-800">Date *</Label>
                <Input
                  id="task-date"
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-slate-800">Lieu *</Label>
                {lieuxLoading ? (
                  <div className="text-sm text-gray-500">Chargement des lieux...</div>
                ) : (
                  <>
                    <Select
                      value={draft.locationId ? String(draft.locationId) : ""}
                      onValueChange={(value) => setDraft((prev) => ({ ...prev, locationId: Number(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un lieu" />
                      </SelectTrigger>
                      <SelectContent>
                        {lieux.length === 0 && (
                          <SelectItem value="__none__" disabled>Aucun lieu disponible</SelectItem>
                        )}
                        {lieux.map((lieu) => (
                          <SelectItem key={lieu.idLieu} value={lieu.idLieu}>{lieu.nomLieu}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {lieuxError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded mt-1">{lieuxError}</div>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-time" className="font-semibold text-slate-800">Heure de début *</Label>
                <Input
                  id="start-time"
                  type="time"
                  step={1}
                  value={draft.startTime}
                  onChange={(e) => setDraft((prev) => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time" className="font-semibold text-slate-800">Heure de fin *</Label>
                <Input
                  id="end-time"
                  type="time"
                  step={1}
                  value={draft.endTime}
                  onChange={(e) => setDraft((prev) => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="required-languages" className="font-semibold text-slate-800">Langues requises</Label>
                <Input
                  id="required-languages"
                  value={draft.requiredLanguages?.join(", ") || ""}
                  onChange={(e) => {
                    const languages = e.target.value
                      .split(",")
                      .map((lang) => lang.trim())
                      .filter((lang) => lang.length > 0);
                    setDraft((prev) => ({ ...prev, requiredLanguages: languages }));
                  }}
                  placeholder="Ex: Français, Anglais, Espagnol (séparées par des virgules)"
                />
              </div>
            </div>

            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
            {success && <div className="text-sm text-green-600 bg-green-50 p-3 rounded">{success}</div>}

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={addTask} disabled={loading}>
                {loading ? "Création en cours..." : "Créer la tâche"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDraft(emptyTask())
                  setSelectedTemplate("custom")
                  setTaskType("ACCUEIL")
                }}
                disabled={loading}
              >
                Réinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-900">Importer des tâches</CardTitle>
            <CardDescription>Importez plusieurs tâches depuis un fichier JSON</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8">
                <div className="text-center space-y-3">
                  <div className="flex justify-center"><FileText className="h-10 w-10 text-gray-400" /></div>
                  <div>
                    <Label className="cursor-pointer">
                      <span className="font-semibold text-blue-600 hover:text-blue-700">Cliquez pour sélectionner</span>
                      <span className="text-muted-foreground"> un fichier JSON</span>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleImportTasksFile(file)
                        }}
                        className="hidden"
                      />
                    </Label>
                  </div>
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
              {success && <div className="text-sm text-green-600 bg-green-50 p-3 rounded">{success}</div>}

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900 mb-2">Format du fichier JSON:</p>
                <pre className="text-xs text-blue-800 overflow-x-auto">
{`[
  {
    "title": "Accueil - Entrée principale",
    "description": "Accueil des athlètes et participants aux Championnats Européens de Natation 2026",
    "taskDate": "2026-03-10",
    "startTime": "09:00:00",
    "endTime": "12:00:00",
    "location": "Piscine Olympique - Entrée A",
    "taskType": "ACCUEIL",
    "requiredLanguages": ["Français", "Anglais"]
  }
]`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manage & Assign Tab */}
      {activeTab === 'manage' && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">Gestion et assignation des tâches</CardTitle>
                <CardDescription>Visualiser, éditer et assigner les tâches aux volontaires</CardDescription>
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
              ) : allTasks.length === 0 ? (
                <div className="text-sm text-muted-foreground">Aucune tâche pour le moment.</div>
              ) : (
                <div className="space-y-4">
                  {allTasks
                    .sort((a, b) => (a.date || "").localeCompare(b.date || ""))
                    .map((task) => (
                      <div key={task.id} className="flex items-start space-x-3 p-4 border rounded bg-gray-50">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-semibold">{task.title}</p>
                              {task.description && (
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                              )}
                            </div>
                            {(task.assignedTo || (task.assignedCount ?? 0) > 0) ? (
                              <Badge variant="outline" className="bg-green-200 text-green-800">✓ Assignée</Badge>
                            ) : (
                              <Badge variant="outline">{task.status}</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {task.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.startTime} - {task.endTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {(() => {
                                // Affiche le nom du lieu si possible
                                const lieu = lieux.find(l => String(l.idLieu) === String(task.locationId));
                                if (lieu && lieu.nomLieu) return lieu.nomLieu;
                                if (task.location) return task.location;
                                return `Lieu #${task.locationId}`;
                              })()}
                            </div>
                            {task.requiredLanguages && task.requiredLanguages.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Globe className="inline mr-1 h-4 w-4 align-text-bottom text-gray-500" />{task.requiredLanguages.join(", ")}
                              </div>
                            )}
                            {(task.assignedTo || (task.assignedCount ?? 0) > 0) && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {task.assignedTo
                                  ? `Vol. ID: ${task.assignedTo}`
                                  : `Volontaires assignés: ${task.assignedCount ?? 0}`}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteConfirmTaskId(task.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                          {task.assignedTo ? (
                            <Button
                              size="sm"
                              className="w-[110px] justify-center"
                              onClick={() => handleUnassignVolunteer(String(task.id), String(task.assignedTo))}
                            >
                              Désassigner
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="w-[110px] justify-center"
                              onClick={() => handleFindSuitableVolunteers(String(task.id))}
                              disabled={(task.assignedCount ?? 0) > 0}
                            >
                              Assigner
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment Modal */}
          {selectedTaskForAssignment !== null && (
            <Card className={`${isVolunteerFallback ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'}`}>
              <CardHeader>
                <CardTitle className={`text-xl font-bold ${isVolunteerFallback ? 'text-orange-900' : 'text-blue-900'}`}>
                  Assignation de volontaire
                </CardTitle>
                <CardDescription className={isVolunteerFallback ? 'text-orange-800' : 'text-blue-800'}>
                  {isVolunteerFallback ? <><AlertTriangle className="inline mr-1 h-4 w-4 text-orange-500 align-text-bottom" />Aucun volontaire ne correspond parfaitement - Affichage de tous les volontaires</> : 'Sélectionnez un volontaire approprié pour cette tâche'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignmentError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{assignmentError}</div>}
                {assignmentSuccess && <div className="text-sm text-green-600 bg-green-50 p-3 rounded">{assignmentSuccess}</div>}
                {suitableVolunteers.length === 0 ? (
                  <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
                    <strong>Volontaires inscrits au total:</strong> {volunteers.length}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {suitableVolunteers.map((matchInfo) => {
                      const volunteer = matchInfo.volunteer
                      const isMatch = typeof matchInfo.isMatch === "boolean" ? matchInfo.isMatch : (matchInfo as any).match === true
                      const missingRequirements = matchInfo.missingRequirements || []

                      return (
                        <div 
                          key={volunteer.id} 
                          className={`p-3 border rounded ${isMatch ? 'bg-green-50 border-green-300 hover:bg-green-100' : 'bg-red-50 border-red-300'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">
                                {volunteer.firstName && volunteer.lastName
                                  ? `${volunteer.firstName} ${volunteer.lastName}`
                                  : volunteer.username || "Volontaire"}
                                {isMatch && <span className="ml-2 text-green-600 text-sm">✓ Compatible</span>}
                                {!isMatch && <span className="ml-2 text-red-600 text-sm">✗ Non compatible</span>}
                              </p>
                              <p className="text-sm text-muted-foreground mb-2">{volunteer.email}</p>
                              {volunteer.languages && volunteer.languages.length > 0 && (
                                <p className="text-xs text-blue-600 mb-2">
                                  <Globe className="inline mr-1 h-4 w-4 align-text-bottom text-gray-500" />Langues: {volunteer.languages.join(", ")}
                                </p>
                              )}
                              
                              {/* Afficher les raisons de non-correspondance */}
                              {!isMatch && (
                                <div className="mt-2 p-2 bg-white border border-red-200 rounded">
                                  <p className="text-xs font-semibold text-red-700 mb-1">
                                    Raisons de non-correspondance: ({missingRequirements.length} raison(s))
                                  </p>
                                  {missingRequirements.length > 0 ? missingRequirements.map((req, idx) => (
                                    <p key={idx} className="text-xs text-red-600 ml-2">
                                      • {req}
                                    </p>
                                  )) : (
                                    <p className="text-xs text-red-600 ml-2">
                                      • Aucune raison fournie par le backend
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={async () => {
                                const result = await handleAssignVolunteer(selectedTaskForAssignment, volunteer.id)
                                if (result.assigned) {
                                  setSelectedTaskForAssignment(null)
                                  setIsVolunteerFallback(false)
                                  return
                                }

                                const msg = (result.errorMessage || "").toLowerCase()
                                const isScheduleConflict =
                                  msg.includes("chevauche") ||
                                  msg.includes("conflit") ||
                                  msg.includes("deja une tache")

                                if (isScheduleConflict) {
                                  setSuitableVolunteers((prev) =>
                                    prev.map((item) => {
                                      if (item.volunteer.id !== volunteer.id) return item

                                      const currentReasons = item.missingRequirements || []
                                      const overlapReason = "A déjà une tâche qui se chevauche"
                                      const alreadyHasReason = currentReasons.some(
                                        (r) => r.toLowerCase().includes("chevauche")
                                      )

                                      return {
                                        ...item,
                                        isMatch: false,
                                        missingRequirements: alreadyHasReason
                                          ? currentReasons
                                          : [...currentReasons, overlapReason],
                                      }
                                    })
                                  )
                                }
                              }}
                              className="ml-2 mt-1"
                              disabled={!isMatch}
                            >
                              Assigner
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedTaskForAssignment(null)
                    setIsVolunteerFallback(false)
                  }}
                >
                  Fermer
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Edit Modal */}
          {editingTaskId !== null && editFormData && (
            <Card className="border-orange-500 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-orange-900">Modifier la tâche</CardTitle>
                <CardDescription className="text-orange-800">Éditer les détails de la tâche</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-title" className="font-semibold text-slate-800">Titre de la tâche</Label>
                    <Input
                      id="edit-title"
                      value={editFormData.title || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      placeholder="Titre de la tâche"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-description" className="font-semibold text-slate-800">Description</Label>
                    <Input
                      id="edit-description"
                      value={editFormData.description || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      placeholder="Description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-date" className="font-semibold text-slate-800">Date</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editFormData.date || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-locationId" className="font-semibold text-slate-800">Lieu</Label>
                    <Select
                      id="edit-locationId"
                      value={editFormData.locationId ? String(editFormData.locationId) : ""}
                      onValueChange={(value) => setEditFormData({ ...editFormData, locationId: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un lieu" />
                      </SelectTrigger>
                      <SelectContent>
                        {lieux.map((lieu) => (
                          <SelectItem key={lieu.idLieu} value={lieu.idLieu}>{lieu.nomLieu}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-start-time" className="font-semibold text-slate-800">Heure de début</Label>
                    <Input
                      id="edit-start-time"
                      type="time"
                      step={1}
                      value={editFormData.startTime || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-end-time" className="font-semibold text-slate-800">Heure de fin</Label>
                    <Input
                      id="edit-end-time"
                      type="time"
                      step={1}
                      value={editFormData.endTime || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-required-languages" className="font-semibold text-slate-800">Langues requises</Label>
                    <Input
                      id="edit-required-languages"
                      value={editFormData.requiredLanguages?.join(", ") || ""}
                      onChange={(e) => {
                        const languages = e.target.value
                          .split(",")
                          .map((lang) => lang.trim())
                          .filter((lang) => lang.length > 0);
                        setEditFormData({ ...editFormData, requiredLanguages: languages });
                      }}
                      placeholder="Ex: Français, Anglais, Espagnol (séparées par des virgules)"
                    />
                  </div>
                </div>
                {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={loading}
                  >
                    {loading ? "Sauvegarde en cours..." : "Sauvegarder"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingTaskId(null)
                      setEditFormData(null)
                    }}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirmTaskId !== null && (
            <Card className="border-red-500 bg-red-50">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-red-900">Confirmer la suppression</CardTitle>
                <CardDescription className="text-red-800">Cette action est irréversible</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-red-800">Êtes-vous certain de vouloir supprimer cette tâche ? Cette action ne peut pas être annulée.</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteTask(deleteConfirmTaskId)}
                    disabled={loading}
                  >
                    {loading ? "Suppression en cours..." : "Supprimer"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteConfirmTaskId(null)}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default VolunteerProgramImport;
