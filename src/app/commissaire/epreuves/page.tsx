"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, RefreshCw, Trash2, Trophy, User, Users } from "lucide-react"
import { toast } from "sonner"
import * as eventsService from "@/src/api/eventsService"

// ─── Types ───────────────────────────────────────────────────────────────────

type TypeEpreuve = "INDIVIDUELLE" | "COLLECTIVE"
type GenreEpreuve = "FEMININ" | "MASCULIN" | "MIXTE"
type NiveauEpreuve = "QUALIFICATION" | "QUART_DE_FINALE" | "DEMI_FINALE" | "FINALE"
type StatutEpreuve = "PLANIFIE" | "EN_COURS" | "TERMINE" | "REPORTE" | "ANNULE"

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

interface AthleteDto {
  id: number
  username: string
  nom: string | null
  prenom: string | null
  pays: string | null
  valide: boolean
  equipeId: number | null
  equipeNom: string | null
}

interface EquipeDto {
  id: number
  nom: string
  pays: string
  athleteIdUsernameMap: Record<string, string>
}

interface Competition {
  id: number
  discipline: string
  event: { id: number }
}

// ─── Constants ────────────────────────────────────────────────────────────────

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
const NIVEAUX: NiveauEpreuve[] = ["QUALIFICATION", "QUART_DE_FINALE", "DEMI_FINALE", "FINALE"]
const STATUTS: StatutEpreuve[] = ["PLANIFIE", "EN_COURS", "TERMINE", "REPORTE", "ANNULE"]
const TYPES: TypeEpreuve[] = ["INDIVIDUELLE", "COLLECTIVE"]
const GENRES: GenreEpreuve[] = ["FEMININ", "MASCULIN", "MIXTE"]

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

function StatutBadge({ statut }: { statut: StatutEpreuve }) {
  const classes: Record<StatutEpreuve, string> = {
    PLANIFIE: "bg-blue-100 text-blue-800",
    EN_COURS: "bg-green-100 text-green-800 animate-pulse",
    TERMINE: "bg-gray-100 text-gray-600",
    REPORTE: "bg-orange-100 text-orange-800",
    ANNULE: "bg-red-100 text-red-800 line-through",
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${classes[statut]}`}>
      {STATUT_LABELS[statut]}
    </span>
  )
}

// ─── Default form ─────────────────────────────────────────────────────────────

const defaultForm = {
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

export default function CommissaireEpreuvesPage() {
  const [epreuves, setEpreuves] = useState<EpreuveDTO[]>([])
  const [athletes, setAthletes] = useState<AthleteDto[]>([])
  const [equipes, setEquipes] = useState<EquipeDto[]>([])
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // CRUD dialog
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editEpreuve, setEditEpreuve] = useState<EpreuveDTO | null>(null)
  const [form, setForm] = useState(defaultForm)

  // Assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignEpreuve, setAssignEpreuve] = useState<EpreuveDTO | null>(null)
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<Set<number>>(new Set())
  const [selectedEquipeIds, setSelectedEquipeIds] = useState<Set<number>>(new Set())
  const [assigning, setAssigning] = useState(false)

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadAll = async () => {
    setLoading(true)
    try {
      const [eprv, comps] = await Promise.all([
        eventsService.getEpreuves().catch(() => []),
        eventsService.getCompetitions().catch(() => []),
      ])
      setEpreuves(Array.isArray(eprv) ? eprv : [])
      setCompetitions(Array.isArray(comps) ? comps : [])
    } catch {
      toast.error("Erreur de chargement des épreuves")
    } finally {
      setLoading(false)
    }
  }

  const loadParticipants = async () => {
    const [aths, eqs] = await Promise.all([
      eventsService.getAthletesValides().catch(() => []),
      eventsService.getAllEquipes().catch(() => []),
    ])
    setAthletes(Array.isArray(aths) ? aths : [])
    setEquipes(Array.isArray(eqs) ? eqs : [])
  }

  useEffect(() => {
    loadAll()
    loadParticipants()
  }, [])

  // ── CRUD handlers ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.nom || !form.competitionId || !form.dateHeure) {
      toast.error("Nom, compétition et date/heure sont obligatoires")
      return
    }
    if ((form.statut === "TERMINE" || form.statut === "ANNULE") && editEpreuve) {
      if (!confirm(`Épreuve ${STATUT_LABELS[form.statut]} — continuer la modification ?`)) return
    }
    setSubmitting(true)
    try {
      const payload = {
        nom: form.nom,
        description: form.description || null,
        dateHeure: form.dateHeure,
        dureeMinutes: Number(form.dureeMinutes),
        statut: form.statut,
        typeEpreuve: form.typeEpreuve,
        genreEpreuve: form.genreEpreuve,
        niveauEpreuve: form.niveauEpreuve,
        competitionId: Number(form.competitionId),
        lieuId: form.lieuId ? Number(form.lieuId) : null,
        athleteIds: [],
        equipeIds: [],
      }
      if (editEpreuve) {
        await eventsService.updateEpreuve(editEpreuve.id, payload)
        toast.success("Épreuve modifiée")
      } else {
        await eventsService.createEpreuve(payload)
        toast.success("Épreuve créée")
      }
      setFormDialogOpen(false)
      setEditEpreuve(null)
      setForm(defaultForm)
      await loadAll()
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'enregistrement")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
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

  const openEdit = (ep: EpreuveDTO) => {
    setEditEpreuve(ep)
    setForm({
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
    setFormDialogOpen(true)
  }

  // ── Assignment handlers ───────────────────────────────────────────────────

  const openAssign = (ep: EpreuveDTO) => {
    setAssignEpreuve(ep)
    setSelectedAthleteIds(new Set(ep.athleteIds))
    setSelectedEquipeIds(new Set(ep.equipeIds))
    setAssignDialogOpen(true)
  }

  const toggleAthlete = (id: number) => {
    setSelectedAthleteIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleEquipe = (id: number) => {
    setSelectedEquipeIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleAssign = async () => {
    if (!assignEpreuve) return
    setAssigning(true)
    try {
      if (assignEpreuve.typeEpreuve === "INDIVIDUELLE") {
        if (selectedAthleteIds.size === 0) {
          toast.error("Sélectionnez au moins un athlète")
          return
        }
        await eventsService.assignAthletesBulk(assignEpreuve.id, Array.from(selectedAthleteIds))
        toast.success(`${selectedAthleteIds.size} athlète(s) assigné(s)`)
      } else {
        if (selectedEquipeIds.size === 0) {
          toast.error("Sélectionnez au moins une équipe")
          return
        }
        await eventsService.assignEquipesToEpreuve(assignEpreuve.id, Array.from(selectedEquipeIds))
        toast.success(`${selectedEquipeIds.size} équipe(s) assignée(s)`)
      }
      setAssignDialogOpen(false)
      await loadAll()
    } catch (e: any) {
      if (e?.message?.includes("409") || e?.message?.toLowerCase().includes("conflit")) {
        toast.warning("Certains participants étaient déjà assignés")
      } else {
        toast.error(e?.message || "Erreur lors de l'assignation")
      }
    } finally {
      setAssigning(false)
    }
  }

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return epreuves.filter((ep) => ep.nom.toLowerCase().includes(term))
  }, [epreuves, searchTerm])

  const getCompetitionLabel = (compId: number) => {
    const c = competitions.find((c) => c.id === compId)
    return c ? c.discipline : `Compétition #${compId}`
  }

  const athleteDisplayName = (a: AthleteDto) => {
    const full = `${a.prenom ?? ""} ${a.nom ?? ""}`.trim()
    return full || a.username || `Athlète #${a.id}`
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Gestion des épreuves</h1>
              <p className="text-muted-foreground mt-1">
                CRUD et assignation des participants aux épreuves
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-7 w-7 text-primary" />
              <Badge variant="outline">Commissaire</Badge>
            </div>
          </div>

          {/* Actions bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher une épreuve..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => { loadAll(); loadParticipants() }} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Rafraîchir
            </Button>

            {/* Create dialog */}
            <Dialog
              open={formDialogOpen}
              onOpenChange={(open) => {
                setFormDialogOpen(open)
                if (!open) { setEditEpreuve(null); setForm(defaultForm) }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle épreuve
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editEpreuve ? "Modifier l'épreuve" : "Créer une épreuve"}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Nom *</Label>
                    <Input
                      placeholder="ex: Finale 100m Nage Libre Homme"
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Compétition *</Label>
                    <Select value={form.competitionId} onValueChange={(v) => setForm({ ...form, competitionId: v })}>
                      <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                      <SelectContent>
                        {competitions.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.discipline} #{c.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date et heure *</Label>
                    <Input
                      type="datetime-local"
                      value={form.dateHeure}
                      onChange={(e) => setForm({ ...form, dateHeure: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.typeEpreuve} onValueChange={(v) => setForm({ ...form, typeEpreuve: v as TypeEpreuve })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t === "INDIVIDUELLE" ? "👤 Individuelle" : "👥 Collective"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Select value={form.genreEpreuve} onValueChange={(v) => setForm({ ...form, genreEpreuve: v as GenreEpreuve })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GENRES.map((g) => (
                          <SelectItem key={g} value={g}>{g === "FEMININ" ? "Féminin" : g === "MASCULIN" ? "Masculin" : "Mixte"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Niveau</Label>
                    <Select value={form.niveauEpreuve} onValueChange={(v) => setForm({ ...form, niveauEpreuve: v as NiveauEpreuve })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {NIVEAUX.map((n) => (
                          <SelectItem key={n} value={n}>{NIVEAU_LABELS[n]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v as StatutEpreuve })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUTS.map((s) => (
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
                      value={form.dureeMinutes}
                      onChange={(e) => setForm({ ...form, dureeMinutes: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID Lieu</Label>
                    <Input
                      type="number"
                      placeholder="Optionnel"
                      value={form.lieuId}
                      onChange={(e) => setForm({ ...form, lieuId: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setFormDialogOpen(false)}>Annuler</Button>
                  <Button onClick={handleSave} disabled={submitting}>
                    {submitting ? "Enregistrement..." : editEpreuve ? "Modifier" : "Créer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Épreuves table */}
          <Card>
            <CardHeader>
              <CardTitle>Épreuves ({filtered.length})</CardTitle>
              <CardDescription>Cliquez sur "Participants" pour assigner des athlètes ou équipes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-2" />
                  Aucune épreuve trouvée
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
                      <TableHead>Participants</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((ep) => (
                      <TableRow key={ep.id}>
                        <TableCell className="font-medium">{ep.nom}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getCompetitionLabel(ep.competitionId)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(ep.dateHeure).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </TableCell>
                        <TableCell>
                          {ep.typeEpreuve === "INDIVIDUELLE"
                            ? <span className="flex items-center gap-1 text-xs"><User className="h-3 w-3" />Individuelle</span>
                            : <span className="flex items-center gap-1 text-xs"><Users className="h-3 w-3" />Collective</span>
                          }
                        </TableCell>
                        <TableCell><NiveauBadge niveau={ep.niveauEpreuve} /></TableCell>
                        <TableCell><StatutBadge statut={ep.statut} /></TableCell>
                        <TableCell className="text-sm">
                          {ep.typeEpreuve === "INDIVIDUELLE"
                            ? `${ep.athleteIds?.length ?? 0} athlète(s)`
                            : `${ep.equipeIds?.length ?? 0} équipe(s)`
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssign(ep)}
                            >
                              Participants
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(ep)}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(ep.id)}
                              disabled={deletingId === ep.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* ── Assignment Dialog ── */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {assignEpreuve?.typeEpreuve === "INDIVIDUELLE" ? (
                <span className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Assigner des athlètes
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assigner des équipes
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {assignEpreuve?.nom}
              {assignEpreuve?.typeEpreuve === "INDIVIDUELLE"
                ? " — Seuls les athlètes validés sont affichés"
                : " — Sélectionnez les équipes participantes"}
            </DialogDescription>
          </DialogHeader>

          {assignEpreuve?.typeEpreuve === "INDIVIDUELLE" ? (
            <div className="space-y-2">
              {athletes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucun athlète validé disponible
                </p>
              ) : (
                athletes.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleAthlete(a.id)}
                  >
                    <Checkbox
                      checked={selectedAthleteIds.has(a.id)}
                      onCheckedChange={() => toggleAthlete(a.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{athleteDisplayName(a)}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.pays ?? "—"} {a.equipeNom ? `· ${a.equipeNom}` : "· Individuel"}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-400 text-xs">
                      Validé
                    </Badge>
                  </div>
                ))
              )}
              <p className="text-sm text-muted-foreground pt-2">
                {selectedAthleteIds.size} athlète(s) sélectionné(s)
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {equipes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune équipe disponible
                </p>
              ) : (
                equipes.map((eq) => {
                  const memberCount = Object.keys(eq.athleteIdUsernameMap ?? {}).length
                  return (
                    <div
                      key={eq.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleEquipe(eq.id)}
                    >
                      <Checkbox
                        checked={selectedEquipeIds.has(eq.id)}
                        onCheckedChange={() => toggleEquipe(eq.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{eq.nom}</div>
                        <div className="text-xs text-muted-foreground">
                          {eq.pays} · {memberCount} membre(s)
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <p className="text-sm text-muted-foreground pt-2">
                {selectedEquipeIds.size} équipe(s) sélectionnée(s)
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleAssign} disabled={assigning}>
              {assigning ? "Assignation..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
