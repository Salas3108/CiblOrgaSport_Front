"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { http } from "@/src/api/httpClient"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Eye,
  MessageSquare,
  Search,
  RefreshCw,
  Shield,
  User,
} from "lucide-react"
import { toast } from "sonner"

// ── Types ──────────────────────────────────────────────────────────────────────

interface AthleteDto {
  id: number
  username: string | null
  nom: string | null
  prenom: string | null
  dateNaissance: string | null
  pays: string | null
  sexe: "MASCULIN" | "FEMININ" | null
  valide: boolean
  docs: {
    certificatMedicalUrl: string | null
    passportUrl: string | null
    documentGenre: string | null
  }
  observation: string | null
  equipeId: number | null
  equipeNom: string | null
  motifRefus: string | null
}

type Filtre = "tous" | "attente" | "valides" | "refuses"

// ── Helpers ────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token") || localStorage.getItem("accessToken")
}

function displayName(a: AthleteDto): string {
  const full = `${a.prenom ?? ""} ${a.nom ?? ""}`.trim()
  return full || a.username || `Athlète #${a.id}`
}

function statut(a: AthleteDto): "valide" | "refuse" | "attente" {
  if (a.valide) return "valide"
  if (a.motifRefus) return "refuse"
  return "attente"
}

function StatutBadge({ a }: { a: AthleteDto }) {
  const s = statut(a)
  if (s === "valide")
    return <Badge className="bg-green-500 text-white hover:bg-green-500 flex items-center gap-1 w-fit"><CheckCircle className="h-3 w-3" />Validé</Badge>
  if (s === "refuse")
    return <Badge variant="destructive" className="flex items-center gap-1 w-fit"><XCircle className="h-3 w-3" />Refusé</Badge>
  return <Badge className="bg-orange-400 text-white hover:bg-orange-400 flex items-center gap-1 w-fit"><Clock className="h-3 w-3" />En attente</Badge>
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function CommissaireAthletesPage() {
  const [athletes, setAthletes] = useState<AthleteDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filtre, setFiltre] = useState<Filtre>("tous")

  // Detail panel
  const [selected, setSelected] = useState<AthleteDto | null>(null)

  // Validation dialog
  const [validDialog, setValidDialog] = useState(false)
  const [validAction, setValidAction] = useState<"valider" | "refuser" | null>(null)
  const [motifRefus, setMotifRefus] = useState("")
  const [validMessage, setValidMessage] = useState("")
  const [validating, setValidating] = useState(false)

  // Message dialog
  const [msgDialog, setMsgDialog] = useState(false)
  const [msgContenu, setMsgContenu] = useState("")
  const [sendingMsg, setSendingMsg] = useState(false)

  // ── Load ─────────────────────────────────────────────────────────────────────

  const fetchAthletes = async () => {
    try {
      setLoading(true)
      const { data } = await http.get<AthleteDto[]>(`${API}/commissaire/athletes`)
      setAthletes(Array.isArray(data) ? data : [])
    } catch {
      // Interceptor showed the toast
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAthletes() }, [])

  // ── Filtered list ─────────────────────────────────────────────────────────────

  const filtered = athletes.filter((a) => {
    const matchSearch =
      displayName(a).toLowerCase().includes(search.toLowerCase()) ||
      (a.pays ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (a.equipeNom ?? "").toLowerCase().includes(search.toLowerCase())

    const s = statut(a)
    if (filtre === "attente") return matchSearch && s === "attente"
    if (filtre === "valides") return matchSearch && s === "valide"
    if (filtre === "refuses") return matchSearch && s === "refuse"
    return matchSearch
  })

  // Stats
  const nbValides = athletes.filter((a) => a.valide).length
  const nbAttente = athletes.filter((a) => statut(a) === "attente").length
  const nbRefuses = athletes.filter((a) => statut(a) === "refuse").length

  // ── PDF view ─────────────────────────────────────────────────────────────────

  const handleViewPdf = async (athleteId: number, docType: "certificatMedical" | "passport") => {
    try {
      const token = getToken()
      const res = await fetch(`${API}/athlete/${athleteId}/doc/${docType}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (res.status === 404) { toast.error("Document non trouvé"); return }
      if (!res.ok) { toast.error("Erreur lors du chargement du document"); return }
      const blob = await res.blob()
      window.open(URL.createObjectURL(blob), "_blank")
    } catch {
      toast.error("Erreur lors de l'ouverture du document")
    }
  }

  // ── Validation ────────────────────────────────────────────────────────────────

  const openValidDialog = (action: "valider" | "refuser") => {
    setValidAction(action)
    setMotifRefus("")
    setValidMessage("")
    setValidDialog(true)
  }

  const handleValider = async () => {
    if (!selected || !validAction) return
    try {
      setValidating(true)
      const body =
        validAction === "valider"
          ? { valide: true, message: validMessage || "Dossier complet, athlète validé." }
          : { valide: false, motifRefus: motifRefus, message: validMessage || motifRefus }

      const { data } = await http.post<AthleteDto>(
        `${API}/commissaire/athletes/${selected.id}/validation`,
        body
      )
      // Update list & selected
      setAthletes((prev) => prev.map((a) => (a.id === data.id ? data : a)))
      setSelected(data)
      toast.success(validAction === "valider" ? "Athlète validé" : "Athlète refusé")
      setValidDialog(false)
    } catch {
      // Interceptor handles the toast
    } finally {
      setValidating(false)
    }
  }

  // ── Message ───────────────────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!selected || !msgContenu.trim()) return
    try {
      setSendingMsg(true)
      await http.post(`${API}/commissaire/athletes/${selected.id}/message`, { contenu: msgContenu.trim() })
      toast.success("Message envoyé")
      setMsgDialog(false)
      setMsgContenu("")
    } catch {
      // Interceptor handles the toast
    } finally {
      setSendingMsg(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gestion des athlètes</h1>
              <p className="text-muted-foreground mt-1">Consultez et validez les dossiers d'inscription</p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              <Badge variant="outline">Commissaire</Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total", value: athletes.length, color: "text-blue-500" },
              { label: "Validés", value: nbValides, color: "text-green-500" },
              { label: "En attente", value: nbAttente, color: "text-orange-500" },
              { label: "Refusés", value: nbRefuses, color: "text-red-500" },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="pt-5 pb-4">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table + detail panel */}
          <div className="grid lg:grid-cols-5 gap-6">

            {/* ── Liste ── */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Athlètes inscrits</CardTitle>
                  <CardDescription>Cliquez sur une ligne pour voir le dossier</CardDescription>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Nom, pays, équipe..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={filtre} onValueChange={(v) => setFiltre(v as Filtre)}>
                      <SelectTrigger className="w-full sm:w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Tous</SelectItem>
                        <SelectItem value="attente">En attente</SelectItem>
                        <SelectItem value="valides">Validés</SelectItem>
                        <SelectItem value="refuses">Refusés</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchAthletes} disabled={loading}>
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <User className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      Aucun athlète trouvé
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom / Prénom</TableHead>
                          <TableHead>Pays</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((a) => (
                          <TableRow
                            key={a.id}
                            className={`cursor-pointer ${selected?.id === a.id ? "bg-primary/5" : "hover:bg-muted/50"}`}
                            onClick={() => setSelected(a)}
                          >
                            <TableCell className="font-medium">{displayName(a)}</TableCell>
                            <TableCell className="text-muted-foreground">{a.pays || "—"}</TableCell>
                            <TableCell><StatutBadge a={a} /></TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); setSelected(a) }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Panneau de détail ── */}
            <div className="lg:col-span-2">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>
                    {selected ? displayName(selected) : "Dossier athlète"}
                  </CardTitle>
                  {selected && <StatutBadge a={selected} />}
                </CardHeader>
                <CardContent>
                  {!selected ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Sélectionnez un athlète dans la liste
                    </p>
                  ) : (
                    <div className="space-y-5">

                      {/* Infos */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <Label className="text-muted-foreground text-xs">Date de naissance</Label>
                          <p className="font-medium">{selected.dateNaissance || "—"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Pays</Label>
                          <p className="font-medium">{selected.pays || "—"}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Sexe</Label>
                          <p className="font-medium">
                            {selected.sexe === "MASCULIN" ? "Masculin" : selected.sexe === "FEMININ" ? "Féminin" : "—"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground text-xs">Équipe</Label>
                          <p className="font-medium">{selected.equipeNom || "Individuel"}</p>
                        </div>
                      </div>

                      {/* Observation */}
                      {selected.observation && (
                        <div className="text-sm p-3 bg-muted/40 rounded-lg border">
                          <p className="text-xs text-muted-foreground mb-1">Observation athlète</p>
                          <p>{selected.observation}</p>
                        </div>
                      )}

                      {/* Motif refus */}
                      {selected.motifRefus && (
                        <div className="text-sm p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
                          <p className="text-xs text-red-500 mb-1">Motif de refus</p>
                          <p className="text-red-700 dark:text-red-300">{selected.motifRefus}</p>
                        </div>
                      )}

                      {/* Documents */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Documents</Label>
                        {(["certificatMedical", "passport"] as const).map((type) => {
                          const url = type === "certificatMedical"
                            ? selected.docs.certificatMedicalUrl
                            : selected.docs.passportUrl
                          const label = type === "certificatMedical" ? "Certificat médical" : "Passeport"
                          return (
                            <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{label}</p>
                                  <p className="text-xs text-muted-foreground">{url ? "Fourni" : "Non fourni"}</p>
                                </div>
                              </div>
                              {url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewPdf(selected.id, type)}
                                >
                                  <Eye className="h-3 w-3 mr-1" /> Voir
                                </Button>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Actions validation */}
                      <div className="flex gap-2 pt-1">
                        <Button
                          className="flex-1"
                          disabled={selected.valide}
                          onClick={() => openValidDialog("valider")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Valider
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          disabled={selected.valide}
                          onClick={() => openValidDialog("refuser")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Refuser
                        </Button>
                      </div>

                      {/* Message */}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => { setMsgContenu(""); setMsgDialog(true) }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Envoyer un message
                      </Button>

                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </main>

      {/* ── Dialog validation ── */}
      <Dialog open={validDialog} onOpenChange={setValidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validAction === "valider" ? "Valider l'athlète" : "Refuser l'athlète"}
            </DialogTitle>
            <DialogDescription>
              {selected && `${displayName(selected)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {validAction === "refuser" && (
              <div className="space-y-1">
                <Label>Motif du refus <span className="text-red-500">*</span></Label>
                <Textarea
                  rows={3}
                  placeholder="Ex : Certificat médical expiré..."
                  value={motifRefus}
                  onChange={(e) => setMotifRefus(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label>Message à l'athlète <span className="text-muted-foreground text-xs">(optionnel)</span></Label>
              <Textarea
                rows={2}
                placeholder={validAction === "valider" ? "Dossier complet, bienvenue !" : "Merci de régulariser votre dossier."}
                value={validMessage}
                onChange={(e) => setValidMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setValidDialog(false)} disabled={validating}>
              Annuler
            </Button>
            <Button
              variant={validAction === "valider" ? "default" : "destructive"}
              onClick={handleValider}
              disabled={validating || (validAction === "refuser" && !motifRefus.trim())}
            >
              {validating ? "Enregistrement..." : validAction === "valider" ? "Confirmer la validation" : "Confirmer le refus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog message ── */}
      <Dialog open={msgDialog} onOpenChange={setMsgDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer un message</DialogTitle>
            <DialogDescription>
              {selected && `À ${displayName(selected)}`}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder="Votre message..."
            value={msgContenu}
            onChange={(e) => setMsgContenu(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsgDialog(false)} disabled={sendingMsg}>
              Annuler
            </Button>
            <Button onClick={handleSendMessage} disabled={sendingMsg || !msgContenu.trim()}>
              {sendingMsg ? "Envoi..." : "Envoyer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
