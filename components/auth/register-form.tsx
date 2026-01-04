"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { assertApiBaseUrlOrThrow } from "@/utils/env"
import Link from "next/link"

// Add mapping of roles to paths
const ROLE_PATHS: Record<string, string> = {
  athlete: "/athlete",
  spectator: "/spectator",
  volunteer: "/volunteer",
  admin: "/admin",
  commissaire: "/commissaire",
}

// Map UI roles to backend enum values
const BACKEND_ROLE_MAP: Record<string, string> = {
  spectator: "USER",
  volunteer: "VOLONTAIRE",
  athlete: "ATHLETE",
  admin: "ADMIN",
  commissaire: "COMMISSAIRE",
}

// Default to gateway so browser clients call the gateway (which should proxy to auth service)
const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
const getApiBaseUrl = (): string => {
  try {
    const url = assertApiBaseUrlOrThrow()
    return url
  } catch {
    return DEFAULT_API_BASE_URL
  }
}

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    role: "spectator",
  })
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; username?: string; password?: string; role?: string }>({})
  const [apiBaseUrl, setApiBaseUrl] = useState<string | null>(null)
  const router = useRouter()

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
      devLog("[RegisterForm] API base URL resolved:", url)
    } catch (e: any) {
      setApiBaseUrl(null)
      setError(
        e?.message ||
          'Missing API base URL. Create ".env.local" with NEXT_PUBLIC_API_BASE_URL or the app will fallback to "http://localhost:8080". Restart the dev server.'
      )
      devLog("[RegisterForm] API base URL error:", e)
    }
  }, [])

  const validate = (data: typeof formData) => {
    const errors: typeof fieldErrors = {}
    const email = data.email.trim()
    const username = data.username.trim()
    const password = data.password

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email invalide."
    }
    if (username.length < 3) {
      errors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères."
    }
    if (password.length < 8) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères."
    } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      errors.password = "Le mot de passe doit inclure des majuscules, minuscules et des chiffres."
    }
    // Ensure role is one of the allowed roles
    if (!data.role?.trim() || !(data.role in ROLE_PATHS)) {
      errors.role = "Veuillez sélectionner un rôle valide."
    }
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    devLog("[RegisterForm] Submit started")

    const trimmed = {
      email: formData.email.trim(),
      username: formData.username.trim(),
      password: formData.password,
      role: formData.role,
    }
    const errors = validate(trimmed)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setIsLoading(false)
      setError("Veuillez corriger les erreurs du formulaire.")
      return
    }

    try {
      const baseUrl = apiBaseUrl || getApiBaseUrl()
      const backendRole = BACKEND_ROLE_MAP[trimmed.role] ?? "USER"
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmed.username,
          email: trimmed.email,
          password: trimmed.password,
          role: backendRole,
        }),
      })
      devLog("[RegisterForm] Response status:", res.status)

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody?.message || "Registration failed")
      }

      setSuccess("Compte créé avec succès. Redirection...")
      // Redirect to role-specific page if available, else fallback to home
      const targetPath = ROLE_PATHS[trimmed.role] || "/"
      setTimeout(() => router.push(targetPath), 1200)
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("[RegisterForm] Error during submit:", err)
      }
      setError(err?.message || "Échec de l'inscription. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <CardTitle className="text-2xl">Créer un compte</CardTitle>
        <CardDescription>
          Inscrivez-vous pour accéder à CiblOrgaSport
          {apiBaseUrl ? (
            <span className="block mt-2 text-xs text-muted-foreground">
              Point d'API: {apiBaseUrl}/auth/register
            </span>
          ) : (
            <span className="block mt-2 text-xs text-red-600">
              NEXT_PUBLIC_API_BASE_URL manquant dans .env.local. Utilisation de "http://localhost:8080".
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              onBlur={() => setFieldErrors((prev) => ({ ...prev, email: validate({ ...formData, email: formData.email.trim() }).email }))}
              required
            />
            {fieldErrors.email && <p className="text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              onBlur={() => setFieldErrors((prev) => ({ ...prev, username: validate({ ...formData, username: formData.username.trim() }).username }))}
              required
            />
            {fieldErrors.username && <p className="text-xs text-red-600">{fieldErrors.username}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              onBlur={() => setFieldErrors((prev) => ({ ...prev, password: validate(formData).password }))}
              required
            />
            <p className="text-xs text-muted-foreground">Au moins 8 caractères, avec majuscules, minuscules et chiffres.</p>
            {fieldErrors.password && <p className="text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <select
              id="role"
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
              onBlur={() => setFieldErrors((prev) => ({ ...prev, role: validate(formData).role }))}
              required
            >
              <option value="athlete">Athlète</option>
              <option value="spectator">Spectateur</option>
              <option value="volunteer">Volontaire</option>
              <option value="commissaire">Commissaire</option>
             
            </select>
            {fieldErrors.role && <p className="text-xs text-red-600">{fieldErrors.role}</p>}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading ||
              !apiBaseUrl ||
              !formData.email.trim() ||
              !formData.username.trim() ||
              !formData.password ||
              !formData.role ||
              Object.keys(validate({
                email: formData.email.trim(),
                username: formData.username.trim(),
                password: formData.password,
                role: formData.role,
              })).length > 0
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer un compte
          </Button>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
