"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import eventsService from "@/src/api/eventsService"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, RefreshCw, Send, Trophy, Medal } from "lucide-react"
import { toast } from "sonner"

// ── Types ──────────────────────────────────────────────────────────────────────

interface ResultatDto {
  id: number
  classement: number | null
  medaille: "OR" | "ARGENT" | "BRONZE" | null
  qualification: boolean
  valeurPrincipale: string
  unite: string | null
  typePerformance: "TEMPS" | "POINTS" | "SCORE"
  athleteId: number | null
  equipeId: number | null
  epreuveId: number
  statut: "EN_ATTENTE" | "VALIDE"
  published: boolean
  athleteNom: string | null
  athletePrenom: string | null
  athletePays: string | null
  equipeNom: string | null
  equipePays: string | null
  epreuveNom: string | null
  discipline: string | null
  niveauEpreuve: string | null
}

type Discipline = "NATATION" | "PLONGEON" | "WATER_POLO" | "NATATION_ARTISTIQUE" | "EAU_LIBRE"
type NiveauEpreuve = "QUALIFICATION" | "QUART_DE_FINALE" | "DEMI_FINALE" | "FINALE"
type TypeEpreuve = "INDIVIDUELLE" | "COLLECTIVE"

interface EpreuveContexteResponse {
  epreuveId: number
  nom: string
  discipline: Discipline
  niveauEpreuve: NiveauEpreuve
  typeEpreuve: TypeEpreuve
  athletes: { id: number; nom: string; prenom: string; pays: string }[]
  equipes: { id: number; nom: string; pays: string }[]
}

interface EpreuveListItem {
  id: number
  nom: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

// ── Helpers ────────────────────────────────────────────────────────────────────

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" }
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken")
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" }
}

const getPlaceholder = (discipline: Discipline | undefined): string => {
  switch (discipline) {
    case "NATATION":
    case "EAU_LIBRE":
      return "Ex: 49.95 (secondes)"
    case "PLONGEON":
    case "NATATION_ARTISTIQUE":
      return "Ex: 89.50 (points)"
    case "WATER_POLO":
      return "Ex: 12-8 (buts)"
    default:
      return "Performance"
  }
}

const disciplineLabel: Record<Discipline, string> = {
  NATATION: "Natation",
  EAU_LIBRE: "Eau libre",
  PLONGEON: "Plongeon",
  NATATION_ARTISTIQUE: "Natation artistique",
  WATER_POLO: "Water-polo",
}

const niveauLabel: Record<NiveauEpreuve, string> = {
  QUALIFICATION: "Qualification",
  QUART_DE_FINALE: "Quart de finale",
  DEMI_FINALE: "Demi-finale",
  FINALE: "Finale",
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MedailleBadge({ medaille }: { medaille: ResultatDto["medaille"] }) {
  if (medaille === "OR")
    return (
      <Badge style={{ backgroundColor: "#FFD700", color: "#000" }}>OR</Badge>
    )
  if (medaille === "ARGENT")
    return (
      <Badge style={{ backgroundColor: "#C0C0C0", color: "#000" }}>ARGENT</Badge>
    )
  if (medaille === "BRONZE")
    return (
      <Badge style={{ backgroundColor: "#CD7F32", color: "#fff" }}>BRONZE</Badge>
    )
  return <span className="text-muted-foreground">—</span>
}

function StatutBadge({ statut, published }: { statut: ResultatDto["statut"]; published: boolean }) {
  if (published)
    return <Badge style={{ backgroundColor: "#3b82f6", color: "#fff" }}>Publié</Badge>
  if (statut === "VALIDE")
    return <Badge className="bg-green-500 text-white hover:bg-green-500">Validé</Badge>
  return <Badge className="bg-orange-400 text-white hover:bg-orange-400">En attente</Badge>
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CommissaireResultatsPage() {
  const [epreuves, setEpreuves] = useState<EpreuveListItem[]>([])
  const [loadingEpreuves, setLoadingEpreuves] = useState(true)

  const [selectedEpreuveId, setSelectedEpreuveId] = useState("")
  const [contexte, setContexte] = useState<EpreuveContexteResponse | null>(null)
  const [loadingContexte, setLoadingContexte] = useState(false)

  const [perfValues, setPerfValues] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const [resultats, setResultats] = useState<ResultatDto[]>([])
  const [validating, setValidating] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // ── Derived state ────────────────────────────────────────────────────────────

  const hasResults = resultats.length > 0
  const anyPending = resultats.some((r) => r.statut === "EN_ATTENTE")
  const allValidated = hasResults && resultats.every((r) => r.statut === "VALIDE")
  const allPublished = hasResults && resultats.every((r) => r.published)

  const participants =
    contexte?.typeEpreuve === "INDIVIDUELLE" ? contexte.athletes : contexte?.equipes ?? []

  // ── API calls ────────────────────────────────────────────────────────────────

  const fetchEpreuves = async () => {
    try {
      setLoadingEpreuves(true)
      const data = await eventsService.getEpreuves().catch(() => [])
      const list: EpreuveListItem[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.epreuves)
          ? data.epreuves
          : []
      setEpreuves(list)
    } catch {
      toast.error("Erreur lors du chargement des épreuves")
    } finally {
      setLoadingEpreuves(false)
    }
  }

  const fetchContexte = async (epreuveId: number) => {
    try {
      setLoadingContexte(true)
      setContexte(null)
      setResultats([])
      setPerfValues({})

      const response = await fetch(
        `${API_BASE_URL}/resultats/commissaire/epreuves/${epreuveId}/contexte`,
        { headers: getAuthHeaders() }
      )
      if (response.status === 401) {
        toast.error("Session expirée, veuillez vous reconnecter")
        return
      }
      if (response.status === 403) {
        toast.error("Accès refusé")
        return
      }
      if (response.status === 404) {
        toast.error("Épreuve introuvable")
        return
      }
      if (!response.ok) throw new Error(`Erreur ${response.status}`)

      const data: EpreuveContexteResponse = await response.json()
      setContexte(data)

      // Pre-fill empty performance values for each participant
      const initial: Record<number, string> = {}
      if (data.typeEpreuve === "INDIVIDUELLE") {
        data.athletes.forEach((a) => { initial[a.id] = "" })
      } else {
        data.equipes.forEach((e) => { initial[e.id] = "" })
      }
      setPerfValues(initial)
    } catch {
      toast.error("Impossible de charger le contexte de l'épreuve")
    } finally {
      setLoadingContexte(false)
    }
  }

  const fetchResultatsExistants = async (epreuveId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/resultats/commissaire/epreuves/${epreuveId}`,
        { headers: getAuthHeaders() }
      )
      if (!response.ok) return
      const data = await response.json()
      if (Array.isArray(data) && data.length > 0) setResultats(data)
    } catch {
      // Silently ignore — no existing results yet
    }
  }

  const handleSoumettre = async () => {
    if (!contexte) return

    const isIndividuelle = contexte.typeEpreuve === "INDIVIDUELLE"
    const performances = Object.entries(perfValues)
      .filter(([, val]) => val.trim() !== "")
      .map(([id, valeur]) =>
        isIndividuelle
          ? { athleteId: Number(id), valeurPrincipale: valeur.trim() }
          : { equipeId: Number(id), valeurPrincipale: valeur.trim() }
      )

    if (performances.length === 0) {
      toast.error("Veuillez saisir au moins une performance")
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(
        `${API_BASE_URL}/resultats/commissaire/epreuves/${contexte.epreuveId}/saisie`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ performances }),
        }
      )

      if (response.status === 401) { toast.error("Session expirée"); return }
      if (response.status === 403) { toast.error("Accès refusé"); return }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || err.error || `Erreur ${response.status}`)
      }

      const data: ResultatDto[] = await response.json()
      setResultats(data)
      toast.success(`${data.length} performance(s) enregistrée(s)`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la saisie")
    } finally {
      setSubmitting(false)
    }
  }

  const handleValiderTout = async () => {
    if (!contexte) return
    try {
      setValidating(true)
      const response = await fetch(
        `${API_BASE_URL}/resultats/commissaire/epreuves/${contexte.epreuveId}/valider-tout`,
        { method: "POST", headers: getAuthHeaders() }
      )
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || `Erreur ${response.status}`)
      }
      const data: ResultatDto[] = await response.json()
      setResultats(data)
      toast.success("Tous les résultats ont été validés")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la validation")
    } finally {
      setValidating(false)
    }
  }

  const handlePublierTout = async () => {
    if (!contexte) return
    try {
      setPublishing(true)
      const response = await fetch(
        `${API_BASE_URL}/resultats/commissaire/epreuves/${contexte.epreuveId}/publier-tout`,
        { method: "POST", headers: getAuthHeaders() }
      )
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.message || "Validez tous les résultats avant de publier")
      }
      const data: { epreuveId: number; nbResultatsPublies: number; success: boolean } =
        await response.json()
      // Mark all resultats as published
      setResultats((prev) => prev.map((r) => ({ ...r, published: true })))
      toast.success(`${data.nbResultatsPublies} résultat(s) publié(s) ✓`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la publication")
    } finally {
      setPublishing(false)
    }
  }

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchEpreuves()
  }, [])

  useEffect(() => {
    if (!selectedEpreuveId) return
    const id = Number(selectedEpreuveId)
    fetchContexte(id).then(() => fetchResultatsExistants(id))
  }, [selectedEpreuveId])

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Saisie des résultats</h1>
              <p className="text-muted-foreground mt-1">
                Enregistrez, validez et publiez les performances par épreuve
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="h-8 w-8 text-primary" />
              <Badge variant="outline" className="text-sm">Commissaire</Badge>
            </div>
          </div>

          {/* ── Sélection épreuve ── */}
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner une épreuve</CardTitle>
              <CardDescription>Choisissez l'épreuve pour laquelle saisir les résultats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Select
                    value={selectedEpreuveId}
                    onValueChange={setSelectedEpreuveId}
                    disabled={loadingEpreuves}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingEpreuves ? "Chargement..." : "Choisir une épreuve"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {epreuves.map((e) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={fetchEpreuves}
                  disabled={loadingEpreuves}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rafraîchir
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Contexte épreuve + formulaire de saisie ── */}
          {loadingContexte && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                <p className="mt-2 text-muted-foreground">Chargement du contexte...</p>
              </div>
            </div>
          )}

          {contexte && !loadingContexte && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      {contexte.nom}
                    </CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {disciplineLabel[contexte.discipline] ?? contexte.discipline}
                      </Badge>
                      <Badge variant="secondary">
                        {niveauLabel[contexte.niveauEpreuve] ?? contexte.niveauEpreuve}
                      </Badge>
                      <Badge variant="outline">
                        {contexte.typeEpreuve === "INDIVIDUELLE" ? "Individuelle" : "Collective"}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-sm self-start sm:self-auto">
                    {participants.length} participant(s)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {participants.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    Aucun participant assigné à cette épreuve.
                  </p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {contexte.typeEpreuve === "INDIVIDUELLE"
                        ? contexte.athletes.map((athlete) => (
                            <div
                              key={athlete.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-2"
                            >
                              <Label className="sm:w-56 shrink-0 font-medium">
                                {athlete.prenom} {athlete.nom}
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({athlete.pays})
                                </span>
                              </Label>
                              <Input
                                className="max-w-xs"
                                placeholder={getPlaceholder(contexte.discipline)}
                                value={perfValues[athlete.id] ?? ""}
                                onChange={(e) =>
                                  setPerfValues((prev) => ({
                                    ...prev,
                                    [athlete.id]: e.target.value,
                                  }))
                                }
                                disabled={allPublished || submitting}
                              />
                            </div>
                          ))
                        : contexte.equipes.map((equipe) => (
                            <div
                              key={equipe.id}
                              className="flex flex-col sm:flex-row sm:items-center gap-2"
                            >
                              <Label className="sm:w-56 shrink-0 font-medium">
                                {equipe.nom}
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({equipe.pays})
                                </span>
                              </Label>
                              <Input
                                className="max-w-xs"
                                placeholder={getPlaceholder(contexte.discipline)}
                                value={perfValues[equipe.id] ?? ""}
                                onChange={(e) =>
                                  setPerfValues((prev) => ({
                                    ...prev,
                                    [equipe.id]: e.target.value,
                                  }))
                                }
                                disabled={allPublished || submitting}
                              />
                            </div>
                          ))}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      {/* Soumettre / Modifier */}
                      <Button
                        onClick={handleSoumettre}
                        disabled={submitting || allPublished}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {submitting
                          ? "Envoi..."
                          : hasResults
                            ? "Modifier les performances"
                            : "Soumettre les performances"}
                      </Button>

                      {/* Valider tout */}
                      <Button
                        variant="outline"
                        onClick={handleValiderTout}
                        disabled={!hasResults || !anyPending || allPublished || validating}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {validating ? "Validation..." : "Valider tout"}
                      </Button>

                      {/* Publier tout */}
                      <Button
                        variant="default"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={handlePublierTout}
                        disabled={!hasResults || !allValidated || allPublished || publishing}
                        title={
                          !allValidated && hasResults
                            ? "Validez tous les résultats avant de publier"
                            : undefined
                        }
                      >
                        {publishing ? "Publication..." : "Publier tout"}
                      </Button>

                      {allPublished && (
                        <div className="flex items-center gap-2 text-blue-600 font-medium">
                          <CheckCircle className="h-5 w-5" />
                          Résultats publiés ✓
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Tableau des résultats ── */}
          {hasResults && (
            <Card>
              <CardHeader>
                <CardTitle>Classement</CardTitle>
                <CardDescription>
                  Résultats calculés automatiquement par le serveur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rang</TableHead>
                      <TableHead>Participant</TableHead>
                      <TableHead>Pays</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Médaille</TableHead>
                      <TableHead>Qualification</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultats
                      .slice()
                      .sort((a, b) => (a.classement ?? 999) - (b.classement ?? 999))
                      .map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-bold text-center">
                            {r.classement ?? "—"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {r.athleteId
                              ? `${r.athletePrenom ?? ""} ${r.athleteNom ?? ""}`.trim() || `#${r.athleteId}`
                              : r.equipeNom ?? `Équipe #${r.equipeId}`}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.athletePays ?? r.equipePays ?? "—"}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono">{r.valeurPrincipale}</span>
                            {r.unite && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                {r.unite}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <MedailleBadge medaille={r.medaille} />
                          </TableCell>
                          <TableCell>
                            {r.qualification ? (
                              <Badge className="bg-green-500 text-white hover:bg-green-500">Q</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatutBadge statut={r.statut} published={r.published} />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
