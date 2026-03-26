"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  getVolunteerProfile, 
  getVolunteerSchedule,
  completeVolunteerProfile,
  type VolunteerTask,
  type VolunteerProfile,
  type AvailabilityDTO
} from "@/src/api/volunteerService"
import { getLieux } from "@/src/api/eventsService"
import { Calendar, MapPin, Clock, CheckCircle, AlertCircle, Edit2, ChevronLeft, ChevronRight, Trash2, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const TASK_TYPES = [
  "ACCUEIL",
  "ORIENTATION",
  "SUPPORT_LOGISTIQUE",
  "SECURITE",
  "PREMIERS_SECOURS",
  "ACCOMPAGNEMENT_ATHLETES",
  "DISTRIBUTION_EAU",
  "NETTOYAGE",
  "BILLETTERIE",
  "INFORMATION",
  "AUTRE"
]

const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
]

const DAYS_LABEL: Record<string, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche"
}

type VolunteerView = "profile" | "program"

export function VolunteerPageContent({ view }: { view: VolunteerView }) {
  const [profile, setProfile] = useState<VolunteerProfile | null>(null)
  const [allTasks, setAllTasks] = useState<VolunteerTask[]>([])
  const [lieux, setLieux] = useState<{ idLieu: string; nomLieu: string }[]>([])
    // Charger la liste des lieux au montage
    useEffect(() => {
      getLieux().then((data) => {
        if (Array.isArray(data)) {
          // Map backend fields to frontend expected fields
          const mapped = data.map((lieu: any) => ({
            idLieu: lieu.id?.toString() ?? '',
            nomLieu: lieu.nom ?? '',
          }))
          setLieux(mapped)
        } else {
          setLieux([])
        }
      }).catch(() => setLieux([]))
    }, [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [profileFormData, setProfileFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    languages: [] as string[],
    preferredTaskTypes: [] as string[],
    availabilities: [] as AvailabilityDTO[],
  })
  const [languageInput, setLanguageInput] = useState("")

  // Load profile on mount
  useEffect(() => {
    loadProfile()
  }, [])

  // Load monthly tasks when month changes
  useEffect(() => {
    loadAllMonthlyTasks()
  }, [currentMonth])

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    setProfileError(null)
    try {
      const data = await getVolunteerProfile()
      setProfile(data)
      setProfileFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phoneNumber: data.phoneNumber || "",
        languages: data.languages || [],
        preferredTaskTypes: data.preferredTaskTypes || [],
        availabilities: data.availabilities || [],
      })
    } catch (e: any) {
      // 404 is expected for new volunteers without a profile yet - don't show error
      const errorMsg = e?.message || ""
      if (!errorMsg.includes("404")) {
        setError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadAllMonthlyTasks = async () => {
    setLoading(true)
    try {
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().slice(0, 10)
      const data = await getVolunteerSchedule(firstDay)
      setAllTasks(data)
    } catch (e: any) {
      // 404 is expected for new volunteers without assigned tasks yet
      const errorMsg = e?.message || ""
      if (!errorMsg.includes("404")) {
        console.error("Erreur lors du chargement des tâches:", e)
      }
      setAllTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setProfileError(null)
    setProfileSuccess(null)
    try {
      const payload = {
        ...profileFormData,
        languages: (profileFormData.languages || [])
          .map((l) => l.trim())
          .filter((l) => l.length > 0),
      }
      const updated = await completeVolunteerProfile(payload)
      setProfile({
        ...updated,
        // Fallback to payload languages if backend omits the field in response
        languages: updated.languages && updated.languages.length > 0 ? updated.languages : payload.languages,
      })
      setProfileSuccess("Profil mis à jour avec succès!")
      setEditingProfile(false)
    } catch (e: any) {
      setProfileError(e?.message || "Erreur lors de la mise à jour du profil")
    } finally {
      setLoading(false)
    }
  }

  const handleAddLanguage = (lang: string) => {
    const normalized = lang.trim()
    if (!normalized) return
    if (!profileFormData.languages.includes(normalized)) {
      setProfileFormData({
        ...profileFormData,
        languages: [...profileFormData.languages, normalized]
      })
    }
  }

  const handleRemoveLanguage = (lang: string) => {
    setProfileFormData({
      ...profileFormData,
      languages: profileFormData.languages.filter(l => l !== lang)
    })
  }

  const handleToggleTaskType = (type: string) => {
    if (profileFormData.preferredTaskTypes.includes(type)) {
      setProfileFormData({
        ...profileFormData,
        preferredTaskTypes: profileFormData.preferredTaskTypes.filter(t => t !== type)
      })
    } else {
      setProfileFormData({
        ...profileFormData,
        preferredTaskTypes: [...profileFormData.preferredTaskTypes, type]
      })
    }
  }

  const handleAddAvailability = () => {
    const newAvailability: AvailabilityDTO = {
      dayOfWeek: "MONDAY",
      startTime: "09:00",
      endTime: "17:00"
    }
    setProfileFormData({
      ...profileFormData,
      availabilities: [...profileFormData.availabilities, newAvailability]
    })
  }

  const handleRemoveAvailability = (index: number) => {
    setProfileFormData({
      ...profileFormData,
      availabilities: profileFormData.availabilities.filter((_, i) => i !== index)
    })
  }

  const handleUpdateAvailability = (index: number, field: string, value: string) => {
    const updated = [...profileFormData.availabilities]
    updated[index] = { ...updated[index], [field]: value }
    setProfileFormData({
      ...profileFormData,
      availabilities: updated
    })
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getTasksForDate = (date: string) => {
    return allTasks.filter(task => task.date === date)
  }

  const monthTasks = allTasks.filter((task) => {
    if (!task?.date) return false
    const d = new Date(task.date)
    if (Number.isNaN(d.getTime())) return false
    return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth()
  })

  const monthName = currentMonth.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return (
    <ProtectedRoute allowedRoles={["volunteer"]}>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 space-y-6">
          
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold">Espace Volontaire</h1>
            <p className="text-muted-foreground">Gérez votre profil et consultez votre planning</p>
          </div>

          <div className="border-b pb-2">
            <span className="inline-flex items-center rounded-md bg-muted px-3 py-1 text-sm font-medium">
              {view === "profile" ? "👤 Mon Profil" : "📅 Mon Programme"}
            </span>
          </div>

          {/* Profile Tab */}
          {view === 'profile' && (
            <div className="space-y-6">
          
              {/* Profile Completion Form - Always visible */}
              {!profile?.profileComplete && (
                <Card className="border-orange-400 bg-orange-50">
                  <CardHeader className="border-b border-orange-200">
                    <CardTitle className="flex items-center gap-2 text-orange-900">
                      <AlertCircle className="h-5 w-5" />
                      Complétez votre profil
                    </CardTitle>
                    <CardDescription className="text-orange-800">
                      Vous devez compléter votre profil pour accéder à toutes les fonctionnalités
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">{error}</div>}
                    <form onSubmit={handleCompleteProfile} className="space-y-6">
                      {/* Infos Personnelles */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Informations Personnelles</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">Prénom *</Label>
                            <Input
                              id="firstName"
                              value={profileFormData.firstName}
                              onChange={(e) => setProfileFormData({ ...profileFormData, firstName: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Nom *</Label>
                            <Input
                              id="lastName"
                              value={profileFormData.lastName}
                              onChange={(e) => setProfileFormData({ ...profileFormData, lastName: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2 col-span-2">
                            <Label htmlFor="phoneNumber">Téléphone</Label>
                            <Input
                              id="phoneNumber"
                              type="tel"
                              value={profileFormData.phoneNumber}
                              onChange={(e) => setProfileFormData({ ...profileFormData, phoneNumber: e.target.value })}
                              placeholder="Ex: +33612345678"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Langues */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Langues parlées</h3>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              id="language-input"
                              value={languageInput}
                              placeholder="Ex: Français, Anglais..."
                              onChange={(e) => setLanguageInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  handleAddLanguage(languageInput)
                                  setLanguageInput("")
                                }
                              }}
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                handleAddLanguage(languageInput)
                                setLanguageInput("")
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {profileFormData.languages.map((lang) => (
                              <Badge key={lang} variant="secondary" className="cursor-pointer">
                                {lang}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLanguage(lang)}
                                  className="ml-2"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Types de Tâches Préférés */}
                      <div className="space-y-4">
                        <h3 className="font-semibold">Types de tâches préférés</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {TASK_TYPES.map((type) => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={profileFormData.preferredTaskTypes.includes(type)}
                                onChange={() => handleToggleTaskType(type)}
                                className="rounded"
                              />
                              <span className="text-sm">{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Disponibilités */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">Vos Disponibilités</h3>
                          <Button
                            type="button"
                            onClick={handleAddAvailability}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {profileFormData.availabilities.map((availability, idx) => (
                            <div key={idx} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-xs">Jour</Label>
                                  <select
                                    value={availability.dayOfWeek}
                                    onChange={(e) => handleUpdateAvailability(idx, "dayOfWeek", e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm"
                                  >
                                    {DAYS_OF_WEEK.map(day => (
                                      <option key={day} value={day}>{DAYS_LABEL[day]}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <Label className="text-xs">Heure début</Label>
                                  <Input
                                    type="time"
                                    value={availability.startTime}
                                    onChange={(e) => handleUpdateAvailability(idx, "startTime", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Heure fin</Label>
                                  <Input
                                    type="time"
                                    value={availability.endTime}
                                    onChange={(e) => handleUpdateAvailability(idx, "endTime", e.target.value)}
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleRemoveAvailability(idx)}
                                variant="destructive"
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {profileError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{profileError}</div>}
                      {profileSuccess && <div className="text-sm text-green-600 bg-green-50 p-3 rounded">{profileSuccess}</div>}
                      <div className="flex gap-2">
                        <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                          {loading ? "Enregistrement..." : "Compléter mon profil"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Profile Card - Show details if complete */}
              {profile?.profileComplete && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between bg-green-50 border-b">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Mon Profil
                      </CardTitle>
                      <CardDescription className="text-green-700">
                        Profil complet
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setEditingProfile(!editingProfile)}
                      className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                      {editingProfile ? "Annuler" : "Modifier mon profil"}
                    </Button>
                  </CardHeader>
                  {editingProfile ? (
                    <CardContent className="pt-6">
                      <form onSubmit={handleCompleteProfile} className="space-y-6">
                        {/* Same form as above but for editing */}
                        <div className="space-y-4">
                          <h3 className="font-semibold">Informations Personnelles</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-firstName">Prénom</Label>
                              <Input
                                id="edit-firstName"
                                value={profileFormData.firstName}
                                onChange={(e) => setProfileFormData({ ...profileFormData, firstName: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-lastName">Nom</Label>
                              <Input
                                id="edit-lastName"
                                value={profileFormData.lastName}
                                onChange={(e) => setProfileFormData({ ...profileFormData, lastName: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label htmlFor="edit-phoneNumber">Téléphone</Label>
                              <Input
                                id="edit-phoneNumber"
                                type="tel"
                                value={profileFormData.phoneNumber}
                                onChange={(e) => setProfileFormData({ ...profileFormData, phoneNumber: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-semibold">Langues parlées</h3>
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Input
                                id="edit-language-input"
                                value={languageInput}
                                placeholder="Ex: Français, Anglais..."
                                onChange={(e) => setLanguageInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleAddLanguage(languageInput)
                                    setLanguageInput("")
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  handleAddLanguage(languageInput)
                                  setLanguageInput("")
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {profileFormData.languages.map((lang) => (
                              <Badge key={lang} variant="secondary" className="cursor-pointer">
                                {lang}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLanguage(lang)}
                                  className="ml-2"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-semibold">Types de tâches préférés</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {TASK_TYPES.map((type) => (
                              <label key={type} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={profileFormData.preferredTaskTypes.includes(type)}
                                  onChange={() => handleToggleTaskType(type)}
                                  className="rounded"
                                />
                                <span className="text-sm">{type}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="font-semibold">Vos Disponibilités</h3>
                          <div className="space-y-3">
                            {profileFormData.availabilities.map((availability, idx) => (
                              <div key={idx} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Label className="text-xs">Jour</Label>
                                    <select
                                      value={availability.dayOfWeek}
                                      onChange={(e) => handleUpdateAvailability(idx, "dayOfWeek", e.target.value)}
                                      className="w-full px-3 py-2 border rounded-md text-sm"
                                    >
                                      {DAYS_OF_WEEK.map(day => (
                                        <option key={day} value={day}>{DAYS_LABEL[day]}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Heure début</Label>
                                    <Input
                                      type="time"
                                      value={availability.startTime}
                                      onChange={(e) => handleUpdateAvailability(idx, "startTime", e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Heure fin</Label>
                                    <Input
                                      type="time"
                                      value={availability.endTime}
                                      onChange={(e) => handleUpdateAvailability(idx, "endTime", e.target.value)}
                                    />
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  onClick={() => handleRemoveAvailability(idx)}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            onClick={handleAddAvailability}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une disponibilité
                          </Button>
                        </div>

                        {profileError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded">{profileError}</div>}
                        {profileSuccess && <div className="text-sm text-green-600 bg-green-50 p-3 rounded">{profileSuccess}</div>}
                        <div className="flex gap-2">
                          <Button type="submit" disabled={loading}>
                            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  ) : (
                    <CardContent className="space-y-6 pt-6">
                      <div>
                        <h3 className="font-semibold mb-3">Informations Personnelles</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Prénom:</span>
                            <p className="font-medium">{profile.firstName}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Nom:</span>
                            <p className="font-medium">{profile.lastName}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>
                            <p className="font-medium">{profile.email}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Téléphone:</span>
                            <p className="font-medium">{profile.phoneNumber || "Non défini"}</p>
                          </div>
                        </div>
                      </div>

                      {((profile.languages && profile.languages.length > 0) || profileFormData.languages.length > 0) && (
                        <div>
                          <h3 className="font-semibold mb-2">Langues</h3>
                          <div className="flex flex-wrap gap-2">
                            {(profile.languages && profile.languages.length > 0
                              ? profile.languages
                              : profileFormData.languages
                            ).map((lang) => (
                              <Badge key={lang} variant="secondary">{lang}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.preferredTaskTypes && profile.preferredTaskTypes.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Types de tâches préférés</h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.preferredTaskTypes.map((type) => (
                              <Badge key={type} variant="outline">{type}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.availabilities && profile.availabilities.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-3">Disponibilités</h3>
                          <div className="space-y-2">
                            {profile.availabilities.map((avail, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                                <p className="font-medium">{DAYS_LABEL[avail.dayOfWeek] || avail.dayOfWeek}</p>
                                <p className="text-muted-foreground">{avail.startTime} - {avail.endTime}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* Program Tab */}
          {view === 'program' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Mes tâches assignées
                      </CardTitle>
                      <CardDescription>Calendrier de vos tâches du mois</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={previousMonth}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="font-medium min-w-48 text-center capitalize">{monthName}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={nextMonth}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-sm text-muted-foreground">Chargement du calendrier...</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-2">
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                          <div key={day} className="text-center font-semibold text-sm p-2">
                            {day}
                          </div>
                        ))}
                        {Array.from({ length: (firstDayOfMonth + 6) % 7 }).map((_, i) => (
                          <div key={`empty-${i}`} className="p-2"></div>
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1
                          const dateStr = formatDate(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                          const dayTasks = getTasksForDate(dateStr)
                          const isToday = new Date().toISOString().slice(0, 10) === dateStr
                          
                          return (
                            <div
                              key={day}
                              className={`p-2 border rounded-lg min-h-24 flex flex-col ${
                                isToday ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className={`font-semibold text-sm mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                                {day}
                              </div>
                              <div className="flex-1 space-y-1 overflow-auto">
                                {dayTasks.length > 0 ? (
                                  dayTasks.map((task) => (
                                    <div
                                      key={task.id}
                                      className="text-xs p-1 bg-green-100 text-green-800 rounded truncate hover:bg-green-200 cursor-pointer"
                                      title={task.title}
                                    >
                                      {task.title}
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-xs text-muted-foreground text-center py-1">—</div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Tasks details for selected period */}
                      {monthTasks.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <h3 className="font-semibold mb-4">Détails des tâches du mois</h3>
                          <div className="space-y-3">
                            {monthTasks
                              .sort((a, b) => {
                                const dateA = a?.date ?? ""
                                const dateB = b?.date ?? ""
                                const timeA = a?.startTime ?? ""
                                const timeB = b?.startTime ?? ""
                                return dateA.localeCompare(dateB) || timeA.localeCompare(timeB)
                              })
                              .map((task) => (
                                <div key={task.id} className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <div className="font-semibold">{task.title}</div>
                                      {task.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                                      )}
                                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
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
                                            const lieu = lieux.find(l => String(l.idLieu) === String(task.locationId));
                                            if (lieu && lieu.nomLieu) return lieu.nomLieu;
                                            if (task.location) return task.location;
                                            return `Lieu #${task.locationId}`;
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                    <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                                      {task.status}
                                    </Badge>
                                  </div>
                                  {task.requiredSkills && task.requiredSkills.length > 0 && (
                                    <div className="flex gap-1 mt-2">
                                      {task.requiredSkills.map((skill) => (
                                        <Badge key={skill} variant="outline" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {monthTasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          Aucune tâche assignée pour ce mois
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

export default function VolunteerPage() {
  return <VolunteerPageContent view="profile" />
}
