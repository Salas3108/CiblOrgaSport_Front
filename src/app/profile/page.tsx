"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { deleteMyAccount } from "../../api/authService"

type StoredUser = {
  username?: string
  email?: string
  role?: string
  name?: string
  authenticated?: boolean
}

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "Administrateur", color: "bg-red-100 text-red-700" },
  COMMISSAIRE: { label: "Commissaire", color: "bg-purple-100 text-purple-700" },
  ATHLETE: { label: "Athlète", color: "bg-blue-100 text-blue-700" },
  VOLUNTEER: { label: "Volontaire", color: "bg-green-100 text-green-700" },
  SPECTATOR: { label: "Spectateur", color: "bg-gray-100 text-gray-700" },
}

function getAuthHeaders() {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("token") ?? localStorage.getItem("accessToken") ?? ""
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function getUsernameFromToken(jwt?: string | null): string | undefined {
  if (!jwt) return undefined
  const parts = jwt.split(".")
  if (parts.length < 2) return undefined
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
    return (
      payload?.preferred_username ||
      payload?.username ||
      (typeof payload?.sub === "string" ? payload.sub : undefined) ||
      (typeof payload?.email === "string" ? payload.email.split("@")[0] : undefined)
    )
  } catch {
    return undefined
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Photo state
  const [photo, setPhoto] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit state
  const [editingDisplayName, setEditingDisplayName] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [editingBio, setEditingBio] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  async function handleDeleteAccount() {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteMyAccount();
      // Nettoyer le localStorage et rediriger
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setDeleting(false);
    }
  }

  // Load photo + display name from localStorage
  useEffect(() => {
    const savedPhoto = localStorage.getItem("profile_photo")
    const savedName = localStorage.getItem("profile_display_name")
    const savedBio = localStorage.getItem("profile_bio")
    if (savedPhoto) setPhoto(savedPhoto)
    if (savedBio) setBio(savedBio)
    if (savedName) setDisplayName(savedName)
  }, [])

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setError(null)
      try {
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("token") ||
          sessionStorage.getItem("accessToken")

        if (!token) {
          setUser({ authenticated: false })
          setError("Aucun jeton trouvé. Veuillez vous reconnecter.")
          return
        }

        const username = getUsernameFromToken(token)
        if (!username) {
          setUser({ authenticated: false })
          setError("Impossible de déterminer l'utilisateur.")
          return
        }

        const res = await fetch(
          `http://localhost:8080/auth/user/username/${encodeURIComponent(username)}`,
          { headers: getAuthHeaders() }
        )

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        const u: StoredUser = {
          authenticated: true,
          username: data?.username || username,
          email: data?.email,
          role: data?.role,
          name: data?.username || username,
        }
        setUser(u)
        // Init display name if not set
        const saved = localStorage.getItem("profile_display_name")
        if (!saved) setDisplayName(u.username ?? "")
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue"
        setError(`Impossible de charger le profil: ${msg}`)
        setUser({ authenticated: false })
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      setPhoto(dataUrl)
      localStorage.setItem("profile_photo", dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function saveDisplayName() {
    localStorage.setItem("profile_display_name", displayName)
    setEditingDisplayName(false)
    showSaved()
  }

  function saveBio() {
    localStorage.setItem("profile_bio", bio)
    setEditingBio(false)
    showSaved()
  }

  function showSaved() {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  function removePhoto() {
    setPhoto(null)
    localStorage.removeItem("profile_photo")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function downloadFile(filename: string, data: Blob | string, mime = "application/json") {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function handleExport() {
    setExportError(null)
    setExporting(true)
    try {
      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token") ||
        sessionStorage.getItem("accessToken")

      const username = getUsernameFromToken(token) || user?.username

      // Try backend export endpoint first (if available)
      if (username) {
        try {
          const res = await fetch(
            `http://localhost:8080/auth/user/export/${encodeURIComponent(username)}`,
            { headers: getAuthHeaders() }
          )
          if (res.ok) {
            const contentType = res.headers.get("content-type") || "application/json"
            const blob = await res.blob()
            const ext = contentType.includes("json") ? "json" : "zip"
            downloadFile(`export-${username}.${ext}`, blob, contentType)
            setExporting(false)
            return
          }
        } catch {
          // backend not available or errored — fallback to client export
        }
      }

      // Client-side export: assemble available profile data + local extras
      const exportData = {
        exportedAt: new Date().toISOString(),
        account: user ?? null,
        displayName: localStorage.getItem("profile_display_name") || null,
        bio: localStorage.getItem("profile_bio") || null,
        photoDataUrl: localStorage.getItem("profile_photo") || null,
        localStorageSnapshot: {
          // exclude tokens for security
          profile_display_name: localStorage.getItem("profile_display_name"),
          profile_bio: localStorage.getItem("profile_bio"),
          profile_photo: localStorage.getItem("profile_photo"),
        },
      }

      downloadFile(`export-${user?.username ?? "me"}.json`, JSON.stringify(exportData, null, 2), "application/json")
    } catch (err) {
      setExportError(err instanceof Error ? err.message : String(err))
    } finally {
      setExporting(false)
    }
  }

  const roleInfo = user?.role ? (ROLE_LABELS[user.role] ?? { label: user.role, color: "bg-gray-100 text-gray-700" }) : null
  const initials = (user?.username ?? "?").slice(0, 2).toUpperCase()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Chargement du profil…</p>
        </div>
      </div>
    )
  }

  if (!user?.authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Non authentifié</h2>
          <p className="text-sm text-gray-500">{error ?? "Veuillez vous reconnecter."}</p>
          <Link href="/login">
            <button className="w-full py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
              Se connecter
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Save feedback */}
        {saveSuccess && (
          <div className="fixed top-20 right-4 z-50 bg-green-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg animate-fade-in">
            ✓ Enregistré
          </div>
        )}

        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600" />

          {/* Avatar + basic info */}
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12 mb-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-blue-100 flex items-center justify-center">
                  {photo ? (
                    <img src={photo} alt="Photo de profil" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-blue-600">{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors text-sm"
                  title="Changer la photo"
                >
                  ✎
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Name + role */}
              <div className="flex-1 min-w-0 pt-14">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900 truncate">
                    {displayName || user.username}
                  </h1>
                  {roleInfo && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">@{user.username}</p>
              </div>
            </div>

            {/* Photo actions */}
            {photo && (
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Changer la photo
                </button>
                <span className="text-gray-300">·</span>
                <button
                  onClick={removePhoto}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Supprimer
                </button>
              </div>
            )}
            {!photo && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mb-4 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                + Ajouter une photo de profil
              </button>
            )}
          </div>
        </div>

        {/* Editable fields */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        {/* Droit à l'oubli : suppression du compte */}
        <div className="px-6 py-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Droit à l'oubli</p>
          <button
            className="py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
            onClick={handleDeleteAccount}
            disabled={deleting}
          >
            {deleting ? "Suppression en cours..." : "Supprimer mon compte"}
          </button>
          {deleteError && <p className="text-red-600 text-sm mt-2">{deleteError}</p>}
        </div>

          {/* Display name */}
          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nom affiché</p>
                {editingDisplayName ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveDisplayName(); if (e.key === "Escape") setEditingDisplayName(false) }}
                      className="flex-1 border border-blue-400 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      autoFocus
                    />
                    <button onClick={saveDisplayName} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Sauv.
                    </button>
                    <button onClick={() => setEditingDisplayName(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
                      ✕
                    </button>
                  </div>
                ) : (
                  <p className="text-base font-medium text-gray-900">{displayName || user.username || "—"}</p>
                )}
              </div>
              {!editingDisplayName && (
                <button
                  onClick={() => setEditingDisplayName(true)}
                  className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium mt-5"
                >
                  Modifier
                </button>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Biographie</p>
                {editingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="Parlez de vous…"
                      className="w-full border border-blue-400 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={saveBio} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Sauvegarder
                      </button>
                      <button onClick={() => setEditingBio(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {bio || <span className="text-gray-400 italic">Aucune biographie</span>}
                  </p>
                )}
              </div>
              {!editingBio && (
                <button
                  onClick={() => setEditingBio(true)}
                  className="shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium mt-5"
                >
                  Modifier
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Read-only account info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Informations du compte</h2>
            <p className="text-xs text-gray-400 mt-0.5">Ces informations sont gérées par le serveur</p>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Nom d'utilisateur</p>
                <p className="text-sm font-medium text-gray-900">@{user.username}</p>
              </div>
              <span className="text-gray-300 text-lg">🔒</span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Adresse e-mail</p>
                <p className="text-sm font-medium text-gray-900">{user.email || "—"}</p>
              </div>
              {user.email && (
                <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full font-medium">Vérifié</span>
              )}
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Rôle</p>
                {roleInfo ? (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleInfo.color}`}>
                    {roleInfo.label}
                  </span>
                ) : (
                  <p className="text-sm font-medium text-gray-900">{user.role || "—"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="py-2.5 px-4 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            {exporting ? "Export en cours…" : "Exporter mes données"}
          </button>
          <Link href="/" className="flex-1">
            <button className="w-full py-2.5 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium">
              ← Retour à l'accueil
            </button>
          </Link>
        </div>

      </div>
    </div>
  )
}
