"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { logout } from "@/utils/auth"
import { assertApiBaseUrlOrThrow } from "@/utils/env"
import Link from "next/link"
import { useAuth } from "@/components/auth/auth-provider"
import { authRepo } from "@/lib/services/auth-service"

// try to decode a JWT payload in browser
function decodeJwtPayload(token: string | null) {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const json = decodeURIComponent(atob(payload).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

// Prefer gateway so browser calls go through proxy and avoid CORS issues
const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://137.74.133.131"
const getApiBaseUrl = (): string => {
  try {
    const url = assertApiBaseUrlOrThrow()
    return url
  } catch {
    return DEFAULT_API_BASE_URL
  }
}

// Backend enum roles -> UI role keys
const BACKEND_TO_UI_ROLE: Record<string, string> = {
  USER: "spectator",
  ROLE_USER: "spectator",
  ATHLETE: "athlete",
  ROLE_ATHLETE: "athlete",
  ADMIN: "admin",
  ROLE_ADMIN: "admin",
  COMMISSAIRE: "commissaire",
  ROLE_COMMISSAIRE: "commissaire",
  VOLONTAIRE: "volunteer",
  ROLE_VOLONTAIRE: "volunteer",
}

// Single source of truth for redirects based on UI role keys
const ROLE_REDIRECTS: Record<string, string> = {
  spectator: "/spectator",
  athlete: "/athlete",
  admin: "/admin",
  commissaire: "/commissaire",
  volunteer: "/volunteer",
}
const POSSIBLE_ROLES = Object.keys(ROLE_REDIRECTS)

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null)
  const router = useRouter()
  const isAuthenticated =
    typeof window !== "undefined" &&
    !!localStorage.getItem("token") &&
    !!localStorage.getItem("user")
  const { login } = useAuth()

  const devLog = (...args: any[]) => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log(...args)
    }
  }

  useEffect(() => {
    try {
      const url = getApiBaseUrl()
      setApiBaseUrl(url)
      setError("")
      devLog("[LoginForm] API base URL resolved:", url)
    } catch (e: any) {
      setApiBaseUrl(null)
      setError(
        e?.message ||
          'URL de base API manquante. Créez ".env.local" avec NEXT_PUBLIC_API_BASE_URL ou l’application utilisera "http://137.74.133.131". Redémarrez le serveur de dev.'
      )
      devLog("[LoginForm] API base URL error:", e)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    devLog("[LoginForm] Submit started with data:", { ...formData, password: "***" })

    try {
      const baseUrl = apiBaseUrl || getApiBaseUrl()
      devLog("[LoginForm] API base URL:", baseUrl)

      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("[LoginForm] Request body:", {
          username: formData.username,
          password: "***",
        })
      }

      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formData.username, password: formData.password }),
      })
      devLog("[LoginForm] Response status:", res.status)

      if (!res.ok) {
        let errBody: any = {}
        const contentType = res.headers.get("content-type") || ""
        
        try {
          if (contentType.includes("application/json")) {
            errBody = await res.json()
          } else {
            // Si c'est du texte brut, l'utiliser comme message
            const text = await res.text()
            if (text) errBody.message = text
          }
        } catch {
          // Ignore parse errors
        }
        
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error("[LoginForm] Error response body:", errBody)
        }
        const errorMessage = errBody?.message || errBody?.detail || errBody?.error || `Authentication failed (HTTP ${res.status})`
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error("[LoginForm] Full error details:", { status: res.status, errBody, errorMessage })
        }
        throw new Error(errorMessage)
      }

      const data = await res.json()
      const { token, type, id, username: resUsername, role: resRole } = data
      // persist token early so downstream normalization/decoding can use it
      localStorage.setItem("token", token)

      // build user object from flat backend response
      let fullUser: any = { username: resUsername, role: resRole, id }
      try {
        if (resUsername) {
          const fetched = await authRepo.getUserByUsername(resUsername)
          if (fetched) fullUser = { ...fullUser, ...fetched }
        }
      } catch (e) {
        // ignore fetch errors; we'll still persist what we have
      }
      const user = fullUser
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("[LoginForm] Response body:", {
          tokenPreview: token ? token.slice(0, 8) + "..." : null,
          user,
        })
      }
      devLog("[LoginForm] Parsed response:", { tokenPreview: token?.slice(0, 8) + "...", user })

      let backendRole = (user?.role || "").toString().trim().toUpperCase()
      let uiRole = BACKEND_TO_UI_ROLE[backendRole] || ""

      // If backend didn't provide role, try to extract from token claims
      if (!uiRole && token) {
        const payload = decodeJwtPayload(token)
        if (payload) {
          // common claim names
          const candidates = [] as string[]
          if (payload.role) candidates.push(String(payload.role))
          if (payload.roles && Array.isArray(payload.roles)) candidates.push(...payload.roles.map(String))
          if (payload.authorities && Array.isArray(payload.authorities)) candidates.push(...payload.authorities.map(String))
          if (payload.realm_access && Array.isArray(payload.realm_access.roles)) candidates.push(...payload.realm_access.roles.map(String))
          if (payload.realm_access && payload.realm_access.roles) candidates.push(...payload.realm_access.roles.map(String))
          if (candidates.length) {
            const found = candidates.map(c => c.toUpperCase()).find(c => BACKEND_TO_UI_ROLE[c])
            if (found) {
              backendRole = found
              uiRole = BACKEND_TO_UI_ROLE[found]
            }
          }
        }
      }

      // Use AuthProvider.login so the context updates immediately
      try {
        login({
          username: fullUser?.username || formData.username,
          email: fullUser?.email || "",
          role: backendRole,
          uiRole,
          name: fullUser?.username || formData.username,
          authenticated: true,
          type: type || "Bearer",
          // include id if available from fetched profile
          id: fullUser?.id ?? fullUser?.userId ?? fullUser?.spectatorId,
        })
      } catch (e) {
        // fallback: persist directly
        localStorage.setItem(
          "user",
          JSON.stringify({
            username: fullUser?.username || formData.username,
            email: fullUser?.email || "",
            role: backendRole,
            uiRole,
            name: fullUser?.username || formData.username,
            authenticated: true,
            type: type || "Bearer",
            id: fullUser?.id ?? fullUser?.userId ?? fullUser?.spectatorId,
          })
        )
      }
      

      const target = "/"; // Redirection vers la page d'accueil après connexion
      router.push(target)
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("[LoginForm] Error during submit:", err)
      }
      setError(err?.message || "Authentication failed. Please try again.")
    } finally {
      devLog("[LoginForm] Submit finished")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl">Se connecter</CardTitle>
        <CardDescription>
          Accédez à votre tableau de bord CiblOrgaSport
          {apiBaseUrl ? (
            <span className="block mt-2 text-xs text-muted-foreground">
              Endpoint API : {apiBaseUrl}/auth/login
            </span>
          ) : (
            <span className="block mt-2 text-xs text-red-600">
              NEXT_PUBLIC_API_BASE_URL est manquant dans .env.local. Utilisation de "http://137.74.133.131". Exemple :
              NEXT_PUBLIC_API_BASE_URL="http://137.74.133.131". Après l’ajout, redémarrez : "npm run dev".
            </span>
          )}
          <span className="block mt-2 text-xs text-muted-foreground">
            Rôles supportés: {POSSIBLE_ROLES.join(", ")}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && !isAuthenticated && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isAuthenticated ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>Vous êtes déjà connecté.</AlertDescription>
            </Alert>
            <Button
              type="button"
              variant="destructive"
              className="w-full"
              onClick={() => logout("/login")}
            >
              Se déconnecter
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Nom d’utilisateur</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="salim"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="password123"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !apiBaseUrl || !formData.username || !formData.password}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Se connecter
            </Button>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Pas de compte ?{" "}
              <Link href="/register" className="text-primary hover:underline">
                S’inscrire
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
