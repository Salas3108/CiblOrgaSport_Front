"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { http } from "@/src/api/httpClient"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Upload,
  Eye,
  MessageSquare,
  Edit,
  Save,
  X,
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

interface Message {
  id: number
  contenu: string
  athleteId: number
  createdAt: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

function getUserIdFromToken(): number | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  if (!token) return null
  try {
    const payload = token.split(".")[1]
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(
      atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    )
    const data = JSON.parse(json)
    const candidate = data.userId ?? data.id ?? data.sub
    const n = Number(candidate)
    return !Number.isNaN(n) && Number.isFinite(n) ? Math.trunc(n) : null
  } catch {
    return null
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token") || localStorage.getItem("accessToken")
}

function statutLabel(athlete: AthleteDto): "valide" | "refuse" | "attente" {
  if (athlete.valide) return "valide"
  if (athlete.motifRefus) return "refuse"
  return "attente"
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AthletePage() {
  const router = useRouter()
  const [athlete, setAthlete] = useState<AthleteDto | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  // Edit info
  const [editMode, setEditMode] = useState(false)
  const [infoForm, setInfoForm] = useState({ nom: "", prenom: "", dateNaissance: "", pays: "", sexe: "" })
  const [savingInfo, setSavingInfo] = useState(false)

  // Documents
  const certRef = useRef<HTMLInputElement>(null)
  const passRef = useRef<HTMLInputElement>(null)
  const [uploadingDoc, setUploadingDoc] = useState<"cert" | "pass" | null>(null)

  // Observation
  const [obsMode, setObsMode] = useState(false)
  const [obsText, setObsText] = useState("")
  const [savingObs, setSavingObs] = useState(false)

  // ── Load on mount ────────────────────────────────────────────────────────────

  useEffect(() => {
    const userId = getUserIdFromToken()
    if (!userId) { setLoading(false); return }
    Promise.all([fetchProfile(userId), fetchMessages(userId)]).finally(() => setLoading(false))
  }, [])

  const applyProfile = (data: AthleteDto) => {
    setAthlete(data)
    setInfoForm({
      nom: data.nom ?? "",
      prenom: data.prenom ?? "",
      dateNaissance: data.dateNaissance ?? "",
      pays: data.pays ?? "",
      sexe: data.sexe ?? "",
    })
    setObsText(data.observation ?? "")
  }

  const fetchProfile = async (id: number) => {
    // Probe silently with native fetch (no Axios interceptor = no toast on 404).
    // Only POST /athlete/{id}/info is documented; try likely GET paths in order.
    const token = getToken()
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
    const candidates = [
      `${API}/athlete/${id}/info`,
      `${API}/athlete/${id}`,
    ]
    for (const url of candidates) {
      try {
        const res = await fetch(url, { headers })
        if (res.status === 403) { router.replace("/unauthorized"); return }
        if (res.ok) {
          const data: AthleteDto = await res.json()
          applyProfile(data)
          return
        }
      } catch { /* network error — try next */ }
    }
    // No GET endpoint exists yet: seed blank profile with JWT id so saves work
    setAthlete({
      id,
      username: null,
      nom: null,
      prenom: null,
      dateNaissance: null,
      pays: null,
      sexe: null,
      valide: false,
      docs: { certificatMedicalUrl: null, passportUrl: null, documentGenre: null },
      observation: null,
      equipeId: null,
      equipeNom: null,
      motifRefus: null,
    })
    setEditMode(true)
  }

  const fetchMessages = async (id: number) => {
    try {
      const { data } = await http.get<Message[]>(`${API}/athlete/${id}/messages`)
      setMessages(Array.isArray(data) ? data : [])
    } catch {
      // Messages unavailable — not critical
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleSaveInfo = async () => {
    if (!athlete) return
    try {
      setSavingInfo(true)
      const { data } = await http.post<AthleteDto>(`${API}/athlete/${athlete.id}/info`, {
        nom: infoForm.nom,
        prenom: infoForm.prenom,
        dateNaissance: infoForm.dateNaissance,
        pays: infoForm.pays,
        sexe: infoForm.sexe || undefined,
      })
      applyProfile(data)
      setEditMode(false)
      toast.success("Informations mises à jour")
    } catch (err: any) {
      if (err?.response?.status === 403) router.replace("/unauthorized")
      // other errors: interceptor already showed toast
    } finally {
      setSavingInfo(false)
    }
  }

  const handleUploadDoc = async (type: "certificatMedical" | "passport", file: File) => {
    if (!athlete) return
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Seuls les fichiers PDF sont acceptés")
      return
    }
    const key = type === "certificatMedical" ? "cert" : "pass"
    try {
      setUploadingDoc(key)
      const token = getToken()
      const formData = new FormData()
      formData.append(type, file)
      // Do NOT set Content-Type — browser adds it with the correct boundary
      const res = await fetch(`${API}/athlete/${athlete.id}/doc/upload`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      })
      if (res.status === 403) { router.replace("/unauthorized"); return }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || err.message || "Erreur lors de l'upload")
        return
      }
      const data: AthleteDto = await res.json()
      setAthlete((prev) => prev ? { ...prev, docs: data.docs } : prev)
      toast.success("Document uploadé avec succès")
    } catch {
      toast.error("Erreur lors de l'upload")
    } finally {
      setUploadingDoc(null)
    }
  }

  const handleViewDoc = async (docType: "certificatMedical" | "passport") => {
    if (!athlete) return
    try {
      const token = getToken()
      const res = await fetch(`${API}/athlete/${athlete.id}/doc/${docType}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (res.status === 404) { toast.error("Document non trouvé"); return }
      if (!res.ok) { toast.error("Erreur lors du chargement du document"); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank")
    } catch {
      toast.error("Erreur lors de l'ouverture du document")
    }
  }

  const handleSaveObs = async () => {
    if (!athlete) return
    try {
      setSavingObs(true)
      const { data } = await http.post<AthleteDto>(`${API}/athlete/${athlete.id}/remarque`, {
        observation: obsText,
      })
      setAthlete(data)
      setObsMode(false)
      toast.success("Remarque enregistrée")
    } catch (err: any) {
      if (err?.response?.status === 403) router.replace("/unauthorized")
    } finally {
      setSavingObs(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-2 text-muted-foreground">Chargement du profil...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Session introuvable. Veuillez vous reconnecter.</p>
        </main>
      </div>
    )
  }

  const statut = statutLabel(athlete)

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">

        {/* ── En-tête profil ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mon profil</h1>
            <p className="text-muted-foreground mt-1">{athlete.username ?? ""}</p>
          </div>
          {statut === "valide" && (
            <Badge className="bg-green-500 text-white flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Validé
            </Badge>
          )}
          {statut === "attente" && (
            <Badge className="bg-orange-400 text-white flex items-center gap-1">
              <Clock className="h-3 w-3" /> En attente
            </Badge>
          )}
          {statut === "refuse" && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Refusé
            </Badge>
          )}
        </div>

        {/* Motif de refus */}
        {statut === "refuse" && athlete.motifRefus && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="pt-4">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Motif du refus :</p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{athlete.motifRefus}</p>
            </CardContent>
          </Card>
        )}

        {/* ── Informations personnelles ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informations personnelles</CardTitle>
              {!editMode ? (
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                  <Edit className="h-4 w-4 mr-1" /> Modifier
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveInfo} disabled={savingInfo}>
                    <Save className="h-4 w-4 mr-1" />
                    {savingInfo ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditMode(false)} disabled={savingInfo}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!editMode ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Nom</span><p className="font-medium">{athlete.nom || "—"}</p></div>
                <div><span className="text-muted-foreground">Prénom</span><p className="font-medium">{athlete.prenom || "—"}</p></div>
                <div><span className="text-muted-foreground">Date de naissance</span><p className="font-medium">{athlete.dateNaissance || "—"}</p></div>
                <div><span className="text-muted-foreground">Pays</span><p className="font-medium">{athlete.pays || "—"}</p></div>
                <div><span className="text-muted-foreground">Sexe</span><p className="font-medium">{athlete.sexe === "MASCULIN" ? "Masculin" : athlete.sexe === "FEMININ" ? "Féminin" : "—"}</p></div>
                {athlete.equipeNom && (
                  <div><span className="text-muted-foreground">Équipe</span><p className="font-medium">{athlete.equipeNom}</p></div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Nom</Label>
                  <Input value={infoForm.nom} onChange={(e) => setInfoForm((p) => ({ ...p, nom: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Prénom</Label>
                  <Input value={infoForm.prenom} onChange={(e) => setInfoForm((p) => ({ ...p, prenom: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Date de naissance</Label>
                  <Input type="date" value={infoForm.dateNaissance} onChange={(e) => setInfoForm((p) => ({ ...p, dateNaissance: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Pays</Label>
                  <Input value={infoForm.pays} onChange={(e) => setInfoForm((p) => ({ ...p, pays: e.target.value }))} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Sexe</Label>
                  <Select value={infoForm.sexe} onValueChange={(v) => setInfoForm((p) => ({ ...p, sexe: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MASCULIN">Masculin</SelectItem>
                      <SelectItem value="FEMININ">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Documents ── */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Certificat médical */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Certificat médical</p>
                  <p className="text-xs text-muted-foreground">
                    {athlete.docs.certificatMedicalUrl ? "Fourni" : "Non fourni"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {athlete.docs.certificatMedicalUrl && (
                  <Button size="sm" variant="outline" onClick={() => handleViewDoc("certificatMedical")}>
                    <Eye className="h-4 w-4 mr-1" /> Voir
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => certRef.current?.click()}
                  disabled={uploadingDoc === "cert"}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {uploadingDoc === "cert" ? "Upload..." : athlete.docs.certificatMedicalUrl ? "Remplacer" : "Uploader"}
                </Button>
                <input
                  ref={certRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadDoc("certificatMedical", f) }}
                />
              </div>
            </div>

            {/* Passeport */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Passeport</p>
                  <p className="text-xs text-muted-foreground">
                    {athlete.docs.passportUrl ? "Fourni" : "Non fourni"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {athlete.docs.passportUrl && (
                  <Button size="sm" variant="outline" onClick={() => handleViewDoc("passport")}>
                    <Eye className="h-4 w-4 mr-1" /> Voir
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => passRef.current?.click()}
                  disabled={uploadingDoc === "pass"}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {uploadingDoc === "pass" ? "Upload..." : athlete.docs.passportUrl ? "Remplacer" : "Uploader"}
                </Button>
                <input
                  ref={passRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadDoc("passport", f) }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Observation personnelle ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Observation personnelle</CardTitle>
              {!obsMode ? (
                <Button variant="outline" size="sm" onClick={() => setObsMode(true)}>
                  <Edit className="h-4 w-4 mr-1" /> Modifier
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveObs} disabled={savingObs}>
                    <Save className="h-4 w-4 mr-1" />
                    {savingObs ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setObsMode(false)} disabled={savingObs}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!obsMode ? (
              <p className="text-sm text-muted-foreground">
                {athlete.observation || "Aucune observation renseignée."}
              </p>
            ) : (
              <Textarea
                rows={4}
                placeholder="Saisissez votre observation..."
                value={obsText}
                onChange={(e) => setObsText(e.target.value)}
              />
            )}
          </CardContent>
        </Card>

        {/* ── Messages du commissaire ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages du commissaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun message reçu.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-3 border rounded-lg bg-muted/30">
                    <p className="text-sm">{msg.contenu}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  )
}
