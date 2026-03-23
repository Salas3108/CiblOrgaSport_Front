"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { http } from "@/src/api/httpClient"
import {
  CheckCircle,
  Clock,
  Edit,
  Eye,
  FileText,
  MessageSquare,
  Save,
  Upload,
  X,
  XCircle,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────

type StoredUser = {
  username?: string
  email?: string
  role?: string
  uiRole?: string
  name?: string
  authenticated?: boolean
  type?: string
}

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

const API = "http://localhost:8080"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken") ||
    null
  )
}

function decodeToken(jwt: string) {
  try {
    const payload = jwt.split(".")[1]
    return JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    )
  } catch {
    return {}
  }
}

function getUserIdFromToken(jwt: string): number | null {
  const p = decodeToken(jwt)
  const candidate = p.userId ?? p.id ?? p.sub
  const n = Number(candidate)
  return !Number.isNaN(n) && Number.isFinite(n) ? Math.trunc(n) : null
}

function getUsernameFromToken(jwt: string): string | undefined {
  const p = decodeToken(jwt)
  return (
    p?.preferred_username ||
    p?.username ||
    (typeof p?.sub === "string" ? p.sub : undefined) ||
    (typeof p?.email === "string" ? p.email.split("@")[0] : undefined)
  )
}

function athleteStatut(a: AthleteDto): "valide" | "refuse" | "attente" {
  if (a.valide) return "valide"
  if (a.motifRefus) return "refuse"
  return "attente"
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter()

  // Auth user
  const [user, setUser] = useState<StoredUser | null>(null)
  const [tokenPreview, setTokenPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [debugResponse, setDebugResponse] = useState<any>(null)

  // Athlete profile (only when role === ATHLETE)
  const [athlete, setAthlete] = useState<AthleteDto | null>(null)
  const [athleteLoading, setAthleteLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

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

  // ── Load auth user ────────────────────────────────────────────────────────────

  const loadProfile = async () => {
    setLoading(true)
    setAuthError(null)
    try {
      const token = getToken()
      setTokenPreview(token ? `${token.slice(0, 8)}...` : null)

      if (!token) {
        setUser({ authenticated: false })
        setAuthError("Aucun jeton trouvé. Veuillez vous reconnecter.")
        return
      }

      const username = getUsernameFromToken(token)
      if (!username) {
        setUser({ authenticated: false })
        setAuthError("Impossible de déterminer l'utilisateur à partir du jeton.")
        return
      }

      const res = await fetch(
        `${API}/auth/user/username/${encodeURIComponent(username)}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDebugResponse(data)

      const role: string = data?.role || decodeToken(token)?.role || ""
      setUser({
        authenticated: true,
        username: data?.username || username,
        email: data?.email,
        role,
        uiRole: role,
        name: data?.username || username,
        type: "Bearer",
      })

      // Load athlete profile if role is ATHLETE
      if (role === "ATHLETE") {
        const id = getUserIdFromToken(token)
        if (id) {
          loadAthleteProfile(id, token)
          loadMessages(id, token)
        }
      }
    } catch (err) {
      setAuthError(`Impossible de charger le profil: ${err instanceof Error ? err.message : "Erreur inconnue"}`)
      setUser({ authenticated: false })
    } finally {
      setLoading(false)
    }
  }

  // ── Load athlete data ─────────────────────────────────────────────────────────

  const applyAthlete = (data: AthleteDto) => {
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

  const loadAthleteProfile = async (id: number, token: string) => {
    setAthleteLoading(true)
    const headers: HeadersInit = { Authorization: `Bearer ${token}` }
    for (const url of [`${API}/athlete/${id}/info`, `${API}/athlete/${id}`]) {
      try {
        const res = await fetch(url, { headers })
        if (res.status === 403) { router.replace("/unauthorized"); return }
        if (res.ok) { applyAthlete(await res.json()); setAthleteLoading(false); return }
      } catch { /* try next */ }
    }
    // No GET endpoint — seed blank profile so saves still work
    setAthlete({
      id, username: null, nom: null, prenom: null, dateNaissance: null,
      pays: null, sexe: null, valide: false,
      docs: { certificatMedicalUrl: null, passportUrl: null, documentGenre: null },
      observation: null, equipeId: null, equipeNom: null, motifRefus: null,
    })
    setEditMode(true)
    setAthleteLoading(false)
  }

  const loadMessages = async (id: number, token: string) => {
    try {
      const { data } = await http.get<Message[]>(`${API}/athlete/${id}/messages`)
      setMessages(Array.isArray(data) ? data : [])
    } catch { /* not critical */ }
  }

  useEffect(() => { loadProfile() }, [])

  // ── Athlete handlers ──────────────────────────────────────────────────────────

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
      applyAthlete(data)
      setEditMode(false)
      toast.success("Informations mises à jour")
    } catch (err: any) {
      if (err?.response?.status === 403) router.replace("/unauthorized")
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
      // No manual Content-Type — browser sets it with the correct boundary
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
    const token = getToken()
    const res = await fetch(`${API}/athlete/${athlete.id}/doc/${docType}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    })
    if (res.status === 404) { toast.error("Document non disponible"); return }
    if (!res.ok) { toast.error("Erreur lors du chargement du document"); return }
    window.open(URL.createObjectURL(await res.blob()), "_blank")
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

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="mt-2 text-gray-600">Chargement du profil…</p>
        </div>
      </div>
    )
  }

  if (!user?.authenticated) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        {authError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{authError}</p>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          <Link href="/login">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Se connecter
            </button>
          </Link>
          <button onClick={loadProfile} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const isAthlete = user?.role === "ATHLETE"

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">

      {/* ── Carte compte ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Profil utilisateur</h2>
          <p className="mt-1 text-sm text-gray-600">Informations de votre compte</p>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nom d'utilisateur</div>
              <div className="text-lg font-medium text-gray-900">{user?.username || "-"}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</div>
              <div className="text-lg font-medium text-gray-900 flex items-center">
                {user?.email || "-"}
                {user?.email && <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Vérifié</span>}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</div>
              <div className="text-lg font-medium text-gray-900">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">{user?.role || "-"}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Token</div>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">{tokenPreview || "—"}</code>
                <button onClick={() => setShowDebug(!showDebug)} className="text-xs text-gray-500 hover:text-gray-700">
                  {showDebug ? "Masquer" : "Détails"}
                </button>
              </div>
            </div>
          </div>

          {showDebug && debugResponse && (
            <pre className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs overflow-auto max-h-48">
              {JSON.stringify(debugResponse, null, 2)}
            </pre>
          )}

          <div className="pt-4 flex flex-wrap gap-3 border-t border-gray-200">
            <Link href="/">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                ← Retour à l'accueil
              </button>
            </Link>
            <button onClick={loadProfile} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* ── Sections athlète ── */}
      {isAthlete && (
        <>
          {athleteLoading ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              <p className="mt-2 text-sm text-gray-500">Chargement du dossier athlète…</p>
            </div>
          ) : athlete ? (
            <>
              {/* Statut de validation */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Statut du dossier</p>
                  {athleteStatut(athlete) === "valide" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4" /> Dossier validé
                    </span>
                  )}
                  {athleteStatut(athlete) === "attente" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      <Clock className="h-4 w-4" /> En attente de validation
                    </span>
                  )}
                  {athleteStatut(athlete) === "refuse" && (
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <XCircle className="h-4 w-4" /> Refusé
                      </span>
                      {athlete.motifRefus && (
                        <p className="mt-2 text-sm text-red-600">Motif : {athlete.motifRefus}</p>
                      )}
                    </div>
                  )}
                </div>
                {athlete.equipeNom && (
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Équipe</p>
                    <p className="text-sm font-medium text-gray-900">{athlete.equipeNom}</p>
                  </div>
                )}
              </div>

              {/* Informations personnelles */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Informations personnelles</h3>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" /> Modifier
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveInfo}
                        disabled={savingInfo}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {savingInfo ? "Enregistrement…" : "Enregistrer"}
                      </button>
                      <button
                        onClick={() => setEditMode(false)}
                        disabled={savingInfo}
                        className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  {!editMode ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[
                        ["Nom", athlete.nom],
                        ["Prénom", athlete.prenom],
                        ["Date de naissance", athlete.dateNaissance],
                        ["Pays", athlete.pays],
                        ["Sexe", athlete.sexe === "MASCULIN" ? "Masculin" : athlete.sexe === "FEMININ" ? "Féminin" : null],
                      ].map(([label, value]) => (
                        <div key={label as string}>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                          <p className="font-medium text-gray-900 mt-0.5">{value || "—"}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {([
                        { key: "nom", label: "Nom", type: "text" },
                        { key: "prenom", label: "Prénom", type: "text" },
                        { key: "dateNaissance", label: "Date de naissance", type: "date" },
                        { key: "pays", label: "Pays", type: "text" },
                      ] as { key: keyof typeof infoForm; label: string; type: string }[]).map(({ key, label, type }) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">{label}</label>
                          <input
                            type={type}
                            value={infoForm[key]}
                            onChange={(e) => setInfoForm((p) => ({ ...p, [key]: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                      <div className="space-y-1 col-span-2">
                        <label className="text-xs font-medium text-gray-700">Sexe</label>
                        <select
                          value={infoForm.sexe}
                          onChange={(e) => setInfoForm((p) => ({ ...p, sexe: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Sélectionner</option>
                          <option value="MASCULIN">Masculin</option>
                          <option value="FEMININ">Féminin</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-900">Mes documents</h3>
                  <p className="text-xs text-gray-500 mt-0.5">PDF uniquement</p>
                </div>
                <div className="p-6 space-y-3">
                  {([
                    { type: "certificatMedical" as const, label: "Certificat médical", url: athlete.docs.certificatMedicalUrl, ref: certRef, key: "cert" as const },
                    { type: "passport" as const, label: "Passeport", url: athlete.docs.passportUrl, ref: passRef, key: "pass" as const },
                  ]).map(({ type, label, url, ref, key }) => (
                    <div key={type} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{label}</p>
                          <p className="text-xs text-gray-500">{url ? "Document fourni" : "Aucun document uploadé"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {url && (
                          <button
                            onClick={() => handleViewDoc(type)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" /> Voir
                          </button>
                        )}
                        <button
                          onClick={() => ref.current?.click()}
                          disabled={uploadingDoc === key}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {uploadingDoc === key ? "Upload…" : url ? "Remplacer" : "Uploader"}
                        </button>
                        <input
                          ref={ref}
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadDoc(type, f) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remarque personnelle */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-gray-900">Ma remarque</h3>
                  {!obsMode ? (
                    <button
                      onClick={() => setObsMode(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" /> Modifier
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveObs}
                        disabled={savingObs}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {savingObs ? "Enregistrement…" : "Enregistrer"}
                      </button>
                      <button onClick={() => setObsMode(false)} className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  {!obsMode ? (
                    <p className="text-sm text-gray-700">{athlete.observation || "Aucune remarque renseignée."}</p>
                  ) : (
                    <textarea
                      rows={4}
                      value={obsText}
                      onChange={(e) => setObsText(e.target.value)}
                      placeholder="Saisissez votre remarque…"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  )}
                </div>
              </div>

              {/* Messages du commissaire */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <h3 className="text-base font-semibold text-gray-900">Messages du commissaire</h3>
                </div>
                <div className="p-6">
                  {messages.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucun message reçu.</p>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div key={msg.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <p className="text-sm text-gray-800">{msg.contenu}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(msg.createdAt).toLocaleString("fr-FR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
