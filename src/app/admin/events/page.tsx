"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, ChevronRight, Plus, RefreshCw, Settings, Trash2, Trophy } from "lucide-react"
import { toast } from "sonner"
import * as eventsService from "@/src/api/eventsService"

// ─── Types ───────────────────────────────────────────────────────────────────

type Discipline = "NATATION" | "WATER_POLO" | "NATATION_ARTISTIQUE" | "PLONGEON" | "EAU_LIBRE"
type TypeEpreuve = "INDIVIDUELLE" | "COLLECTIVE"
type GenreEpreuve = "FEMININ" | "MASCULIN" | "MIXTE"
type NiveauEpreuve = "QUALIFICATION" | "QUART_DE_FINALE" | "DEMI_FINALE" | "FINALE"
type StatutEpreuve = "PLANIFIE" | "EN_COURS" | "TERMINE" | "REPORTE" | "ANNULE"

interface EventDTO {
  id: number
  name: string
  dateDebut: string
  dateFin: string
  description: string | null
  paysHote: string | null
}

interface Competition {
  id: number
  discipline: Discipline
  event: { id: number }
}

interface EpreuveDTO {
  id: number
  nom: string
  description: string | null
  dateHeure: string
  dureeMinutes: number
  statut: StatutEpreuve
  typeEpreuve: TypeEpreuve
  genreEpreuve: GenreEpreuve
  niveauEpreuve: NiveauEpreuve
  competitionId: number
  lieuId: number | null
  athleteIds: number[]
  equipeIds: number[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DISCIPLINES: Discipline[] = ["NATATION", "WATER_POLO", "NATATION_ARTISTIQUE", "PLONGEON", "EAU_LIBRE"]
const DISCIPLINE_LABELS: Record<Discipline, string> = {
  NATATION: "Natation",
  WATER_POLO: "Water-polo",
  NATATION_ARTISTIQUE: "Natation artistique",
  PLONGEON: "Plongeon",
  EAU_LIBRE: "Eau libre",
}
const TYPES_EPREUVE: TypeEpreuve[] = ["INDIVIDUELLE", "COLLECTIVE"]
const GENRES_EPREUVE: GenreEpreuve[] = ["FEMININ", "MASCULIN", "MIXTE"]
const NIVEAUX_EPREUVE: NiveauEpreuve[] = ["QUALIFICATION", "QUART_DE_FINALE", "DEMI_FINALE", "FINALE"]
const NIVEAU_LABELS: Record<NiveauEpreuve, string> = {
  QUALIFICATION: "Qualification",
  QUART_DE_FINALE: "Quart de finale",
  DEMI_FINALE: "Demi-finale",
  FINALE: "Finale",
}
const STATUT_LABELS: Record<StatutEpreuve, string> = {
  PLANIFIE: "Planifié",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  REPORTE: "Reporté",
  ANNULE: "Annulé",
}

function StatutBadge({ statut }: { statut: StatutEpreuve }) {
  const classes: Record<StatutEpreuve, string> = {
    PLANIFIE: "bg-blue-100 text-blue-800 border-blue-200",
    EN_COURS: "bg-green-100 text-green-800 border-green-200 animate-pulse",
    TERMINE: "bg-gray-100 text-gray-600 border-gray-200",
    REPORTE: "bg-orange-100 text-orange-800 border-orange-200",
    ANNULE: "bg-red-100 text-red-800 border-red-200 line-through",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${classes[statut]}`}>
      {STATUT_LABELS[statut]}
    </span>
  )
}

function NiveauBadge({ niveau }: { niveau: NiveauEpreuve }) {
  const classes: Record<NiveauEpreuve, string> = {
    FINALE: "bg-yellow-100 text-yellow-800 border-yellow-400",
    DEMI_FINALE: "bg-slate-100 text-slate-700 border-slate-300",
    QUART_DE_FINALE: "bg-amber-100 text-amber-800 border-amber-300",
    QUALIFICATION: "bg-blue-100 text-blue-700 border-blue-300",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${classes[niveau]}`}>
      {NIVEAU_LABELS[niveau]}
    </span>
  )
}

// ─── Default form states ──────────────────────────────────────────────────────

const defaultEventForm = { name: "", dateDebut: "", dateFin: "", description: "", paysHote: "" }
const defaultCompetitionForm = { eventId: "", discipline: "" as Discipline | "" }
const defaultEpreuveForm = {
  nom: "",
  description: "",
  dateHeure: "",
  dureeMinutes: 60,
  statut: "PLANIFIE" as StatutEpreuve,
  typeEpreuve: "INDIVIDUELLE" as TypeEpreuve,
  genreEpreuve: "MASCULIN" as GenreEpreuve,
  niveauEpreuve: "FINALE" as NiveauEpreuve,
  competitionId: "",
  lieuId: "",
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventDTO[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [epreuves, setEpreuves] = useState<EpreuveDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Forms
  const [eventForm, setEventForm] = useState(defaultEventForm)
  const [competitionForm, setCompetitionForm] = useState(defaultCompetitionForm)
  const [epreuveForm, setEpreuveForm] = useState(defaultEpreuveForm)

  // Dialogs
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [competitionDialogOpen, setCompetitionDialogOpen] = useState(false)
  const [epreuveDialogOpen, setEpreuveDialogOpen] = useState(false)
  const [editEpreuve, setEditEpreuve] = useState<EpreuveDTO | null>(null)

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadAll = async () => {
    setLoading(true)
    try {
      const [evts, comps, eprv] = await Promise.all([
        eventsService.getEvents().catch(() => []),
        eventsService.getCompetitions().catch(() => []),
        eventsService.getEpreuves().catch(() => []),
      ])
      setEvents(Array.isArray(evts) ? evts : [])
      setCompetitions(Array.isArray(comps) ? comps : [])
      setEpreuves(Array.isArray(eprv) ? eprv : [])
    } catch {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // ── Event CRUD ────────────────────────────────────────────────────────────

  const handleCreateEvent = async () => {
    if (!eventForm.name || !eventForm.dateDebut || !eventForm.dateFin) {
      toast.error("Nom, date début et date fin sont obligatoires")
      return
    }
    setSubmitting(true)
    try {
      await eventsService.adminCreateEvent({
        name: eventForm.name,
        dateDebut: eventForm.dateDebut,
        dateFin: eventForm.dateFin,
        description: eventForm.description || null,
        paysHote: eventForm.paysHote || null,
      })
      toast.success("Événement créé")
      setEventForm(defaultEventForm)
      setEventDialogOpen(false)
      await loadAll()
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la création")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEvent = async (id: number) => {
    if (!confirm("Supprimer cet événement ? Cette action est irréversible.")) return
    setDeletingId(id)
    try {
      await eventsService.adminDeleteEvent(id)
      toast.success("Événement supprimé")
      await loadAll()
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la suppression")
    } finally {
      setDeletingId(null)
    }
  }

  // ── Competition CRUD ──────────────────────────────────────────────────────

  const handleCreateCompetition = async () => {
    if (!competitionForm.eventId || !competitionForm.discipline) {
      toast.error("Événement et discipline sont obligatoires")
      return
    }
    setSubmitting(true)
    try {
      await eventsService.adminAddCompetitionToEvent(Number(competitionForm.eventId), {
        discipline: competitionForm.discipline,
      })
      toast.success("Compétition ajoutée")
      setCompetitionForm(defaultCompetitionForm)
      setCompetitionDialogOpen(false)
      await loadAll()
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la création")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Épreuve CRUD ──────────────────────────────────────────────────────────

  const handleSaveEpreuve = async () => {
    if (!epreuveForm.nom || !epreuveForm.competitionId || !epreuveForm.dateHeure) {
      toast.error("Nom, compétition et date/heure sont obligatoires")
      return
    }
    if (epreuveForm.statut === "TERMINE" || epreuveForm.statut === "ANNULE") {
      if (!confirm(`Épreuve ${STATUT_LABELS[epreuveForm.statut]} — continuer la modification ?`)) return
    }
    setSubmitting(true)
    try {
      const payload = {
        nom: epreuveForm.nom,
        description: epreuveForm.description || null,
        dateHeure: epreuveForm.dateHeure,
        dureeMinutes: Number(epreuveForm.dureeMinutes),
        statut: epreuveForm.statut,
        typeEpreuve: epreuveForm.typeEpreuve,
        genreEpreuve: epreuveForm.genreEpreuve,
        niveauEpreuve: epreuveForm.niveauEpreuve,
        competitionId: Number(epreuveForm.competitionId),
        lieuId: epreuveForm.lieuId ? Number(epreuveForm.lieuId) : null,
        athleteIds: [],
        equipeIds: [],
      }
      if (editEpreuve) {
        await eventsService.updateEpreuve(editEpreuve.id, payload)
        toast.success("Épreuve modifiée")
      } else {
        await eventsService.adminAddEpreuveToCompetition(Number(epreuveForm.competitionId), payload)
        toast.success("Épreuve créée")
      }
      setEpreuveForm(defaultEpreuveForm)
      setEditEpreuve(null)
      setEpreuveDialogOpen(false)
      await loadAll()
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'enregistrement")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEpreuve = async (id: number) => {
    if (!confirm("Supprimer cette épreuve ?")) return
    setDeletingId(id)
    try {
      await eventsService.deleteEpreuve(id)
      toast.success("Épreuve supprimée")
      await loadAll()
    } catch (e: any) {
      toast.error(e?.message || "Erreur")
    } finally {
      setDeletingId(null)
    }
  }

  const openEditEpreuve = (ep: EpreuveDTO) => {
    setEditEpreuve(ep)
    setEpreuveForm({
      nom: ep.nom,
      description: ep.description || "",
      dateHeure: ep.dateHeure,
      dureeMinutes: ep.dureeMinutes,
      statut: ep.statut,
      typeEpreuve: ep.typeEpreuve,
      genreEpreuve: ep.genreEpreuve,
      niveauEpreuve: ep.niveauEpreuve,
      competitionId: String(ep.competitionId),
      lieuId: ep.lieuId ? String(ep.lieuId) : "",
    })
    setEpreuveDialogOpen(true)
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getEventName = (eventId: number) =>
    events.find((e) => e.id === eventId)?.name ?? `Événement #${eventId}`
  const getCompetitionLabel = (comp: Competition) =>
    `${DISCIPLINE_LABELS[comp.discipline]} — ${getEventName(comp.event.id)}`
  const getCompetitionForEpreuve = (competitionId: number) =>
    competitions.find((c) => c.id === competitionId)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Gestion des événements</h1>
              <p className="text-muted-foreground mt-1">
                Événements → Compétitions → Épreuves
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-7 w-7 text-primary" />
              <Badge variant="outline">Admin</Badge>
              <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Rafraîchir
              </Button>
            </div>
          </div>

          {/* Hierarchy guide */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3">
            <Calendar className="h-4 w-4" />
            <span>Événement</span>
            <ChevronRight className="h-4 w-4" />
            <Trophy className="h-4 w-4" />
            <span>Compétition (discipline)</span>
            <ChevronRight className="h-4 w-4" />
            <Trophy className="h-4 w-4" />
            <span>Épreuve (finale, demi-finale…)</span>
          </div>

          <Tabs defaultValue="events">
            <TabsList>
              <TabsTrigger value="events">
                Événements ({events.length})
              </TabsTrigger>
              <TabsTrigger value="competitions">
                Compétitions ({competitions.length})
              </TabsTrigger>
              <TabsTrigger value="epreuves">
                Épreuves ({epreuves.length})
              </TabsTrigger>
            </TabsList>

            {/* ── TAB ÉVÉNEMENTS ── */}
            <TabsContent value="events">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Événements</CardTitle>
                      <CardDescription>Liste de tous les événements sportifs</CardDescription>
                    </div>
                    <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nouvel événement
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Créer un événement</DialogTitle>
                          <DialogDescription>Remplissez les informations de l'événement</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Nom *</Label>
                            <Input
                              placeholder="ex: Championnats Mondiaux 2026"
                              value={eventForm.name}
                              onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Date de début *</Label>
                              <Input
                                type="date"
                                value={eventForm.dateDebut}
                                onChange={(e) => setEventForm({ ...eventForm, dateDebut: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Date de fin *</Label>
                              <Input
                                type="date"
                                value={eventForm.dateFin}
                                onChange={(e) => setEventForm({ ...eventForm, dateFin: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Pays hôte</Label>
                            <Input
                              placeholder="ex: France"
                              value={eventForm.paysHote}
                              onChange={(e) => setEventForm({ ...eventForm, paysHote: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              placeholder="Description de l'événement"
                              value={eventForm.description}
                              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEventDialogOpen(false)}>Annuler</Button>
                          <Button onClick={handleCreateEvent} disabled={submitting}>
                            {submitting ? "Création..." : "Créer"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : events.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2" />
                      Aucun événement
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Pays hôte</TableHead>
                          <TableHead>Compétitions</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events.map((ev) => (
                          <TableRow key={ev.id}>
                            <TableCell className="font-medium">{ev.name}</TableCell>
                            <TableCell className="text-sm">
                              {ev.dateDebut} → {ev.dateFin}
                            </TableCell>
                            <TableCell>{ev.paysHote ?? "—"}</TableCell>
                            <TableCell>
                              {competitions.filter((c) => c.event.id === ev.id).length}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteEvent(ev.id)}
                                disabled={deletingId === ev.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── TAB COMPÉTITIONS ── */}
            <TabsContent value="competitions">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Compétitions</CardTitle>
                      <CardDescription>Une compétition = un événement + une discipline</CardDescription>
                    </div>
                    <Dialog open={competitionDialogOpen} onOpenChange={setCompetitionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button disabled={events.length === 0}>
                          <Plus className="h-4 w-4 mr-2" />
                          Nouvelle compétition
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ajouter une compétition</DialogTitle>
                          <DialogDescription>Choisissez l'événement et la discipline</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Événement *</Label>
                            <Select
                              value={competitionForm.eventId}
                              onValueChange={(v) => setCompetitionForm({ ...competitionForm, eventId: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir un événement" />
                              </SelectTrigger>
                              <SelectContent>
                                {events.map((ev) => (
                                  <SelectItem key={ev.id} value={String(ev.id)}>
                                    {ev.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Discipline *</Label>
                            <Select
                              value={competitionForm.discipline}
                              onValueChange={(v) => setCompetitionForm({ ...competitionForm, discipline: v as Discipline })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir une discipline" />
                              </SelectTrigger>
                              <SelectContent>
                                {DISCIPLINES.map((d) => (
                                  <SelectItem key={d} value={d}>
                                    {DISCIPLINE_LABELS[d]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCompetitionDialogOpen(false)}>Annuler</Button>
                          <Button onClick={handleCreateCompetition} disabled={submitting}>
                            {submitting ? "Création..." : "Créer"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {competitions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-2" />
                      Aucune compétition — créez d'abord un événement
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Discipline</TableHead>
                          <TableHead>Événement</TableHead>
                          <TableHead>Épreuves</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {competitions.map((comp) => (
                          <TableRow key={comp.id}>
                            <TableCell>
                              <Badge variant="outline">{DISCIPLINE_LABELS[comp.discipline]}</Badge>
                            </TableCell>
                            <TableCell>{getEventName(comp.event.id)}</TableCell>
                            <TableCell>
                              {epreuves.filter((e) => e.competitionId === comp.id).length}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── TAB ÉPREUVES ── */}
            <TabsContent value="epreuves">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Épreuves</CardTitle>
                      <CardDescription>CRUD complet des épreuves sportives</CardDescription>
                    </div>
                    <Dialog
                      open={epreuveDialogOpen}
                      onOpenChange={(open) => {
                        setEpreuveDialogOpen(open)
                        if (!open) { setEditEpreuve(null); setEpreuveForm(defaultEpreuveForm) }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button disabled={competitions.length === 0}>
                          <Plus className="h-4 w-4 mr-2" />
                          Nouvelle épreuve
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{editEpreuve ? "Modifier l'épreuve" : "Créer une épreuve"}</DialogTitle>
                          <DialogDescription>
                            {editEpreuve ? `Épreuve #${editEpreuve.id}` : "Remplissez les informations de l'épreuve"}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 space-y-2">
                            <Label>Nom *</Label>
                            <Input
                              placeholder="ex: Finale 100m Nage Libre Homme"
                              value={epreuveForm.nom}
                              onChange={(e) => setEpreuveForm({ ...epreuveForm, nom: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Compétition *</Label>
                            <Select
                              value={epreuveForm.competitionId}
                              onValueChange={(v) => setEpreuveForm({ ...epreuveForm, competitionId: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choisir" />
                              </SelectTrigger>
                              <SelectContent>
                                {competitions.map((c) => (
                                  <SelectItem key={c.id} value={String(c.id)}>
                                    {getCompetitionLabel(c)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Date et heure *</Label>
                            <Input
                              type="datetime-local"
                              value={epreuveForm.dateHeure}
                              onChange={(e) => setEpreuveForm({ ...epreuveForm, dateHeure: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={epreuveForm.typeEpreuve}
                              onValueChange={(v) => setEpreuveForm({ ...epreuveForm, typeEpreuve: v as TypeEpreuve })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {TYPES_EPREUVE.map((t) => (
                                  <SelectItem key={t} value={t}>{t === "INDIVIDUELLE" ? "Individuelle" : "Collective"}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Genre</Label>
                            <Select
                              value={epreuveForm.genreEpreuve}
                              onValueChange={(v) => setEpreuveForm({ ...epreuveForm, genreEpreuve: v as GenreEpreuve })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {GENRES_EPREUVE.map((g) => (
                                  <SelectItem key={g} value={g}>
                                    {g === "FEMININ" ? "Féminin" : g === "MASCULIN" ? "Masculin" : "Mixte"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Niveau</Label>
                            <Select
                              value={epreuveForm.niveauEpreuve}
                              onValueChange={(v) => setEpreuveForm({ ...epreuveForm, niveauEpreuve: v as NiveauEpreuve })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {NIVEAUX_EPREUVE.map((n) => (
                                  <SelectItem key={n} value={n}>{NIVEAU_LABELS[n]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Statut</Label>
                            <Select
                              value={epreuveForm.statut}
                              onValueChange={(v) => setEpreuveForm({ ...epreuveForm, statut: v as StatutEpreuve })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {(Object.keys(STATUT_LABELS) as StatutEpreuve[]).map((s) => (
                                  <SelectItem key={s} value={s}>{STATUT_LABELS[s]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Durée (minutes)</Label>
                            <Input
                              type="number"
                              min={1}
                              value={epreuveForm.dureeMinutes}
                              onChange={(e) => setEpreuveForm({ ...epreuveForm, dureeMinutes: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>ID Lieu</Label>
                            <Input
                              type="number"
                              placeholder="ID du lieu (optionnel)"
                              value={epreuveForm.lieuId}
                              onChange={(e) => setEpreuveForm({ ...epreuveForm, lieuId: e.target.value })}
                            />
                          </div>
                          <div className="col-span-2 space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              placeholder="Description de l'épreuve"
                              value={epreuveForm.description}
                              onChange={(e) => setEpreuveForm({ ...epreuveForm, description: e.target.value })}
                              rows={2}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setEpreuveDialogOpen(false)}>Annuler</Button>
                          <Button onClick={handleSaveEpreuve} disabled={submitting}>
                            {submitting ? "Enregistrement..." : editEpreuve ? "Modifier" : "Créer"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {epreuves.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-2" />
                      Aucune épreuve — créez d'abord une compétition
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Compétition</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Niveau</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {epreuves.map((ep) => {
                          const comp = getCompetitionForEpreuve(ep.competitionId)
                          return (
                            <TableRow key={ep.id}>
                              <TableCell className="font-medium">{ep.nom}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {comp ? DISCIPLINE_LABELS[comp.discipline] : `#${ep.competitionId}`}
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(ep.dateHeure).toLocaleString("fr-FR", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </TableCell>
                              <TableCell>
                                <span className="text-xs">
                                  {ep.typeEpreuve === "INDIVIDUELLE" ? "👤 Individuelle" : "👥 Collective"}
                                </span>
                              </TableCell>
                              <TableCell><NiveauBadge niveau={ep.niveauEpreuve} /></TableCell>
                              <TableCell><StatutBadge statut={ep.statut} /></TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditEpreuve(ep)}
                                  >
                                    Modifier
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteEpreuve(ep.id)}
                                    disabled={deletingId === ep.id}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
