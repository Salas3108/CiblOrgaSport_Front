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

const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081"
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
    confirmPassword: "",
  })
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
          'Missing API base URL. Create ".env.local" with NEXT_PUBLIC_API_BASE_URL or the app will fallback to "http://localhost:8081". Restart the dev server.'
      )
      devLog("[RegisterForm] API base URL error:", e)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")
    devLog("[RegisterForm] Submit started")

    if (formData.password !== formData.confirmPassword) {
      setIsLoading(false)
      setError("Passwords do not match.")
      return
    }

    try {
      const baseUrl = apiBaseUrl || getApiBaseUrl()
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username || formData.email.split("@")[0],
          password: formData.password,
        }),
      })
      devLog("[RegisterForm] Response status:", res.status)

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody?.message || "Registration failed")
      }

      setSuccess("Account created successfully. Redirecting to login...")
      setTimeout(() => router.push("/login"), 1200)
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("[RegisterForm] Error during submit:", err)
      }
      setError(err?.message || "Registration failed. Please try again.")
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
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>
          Register to access CiblOrgaSport
          {apiBaseUrl ? (
            <span className="block mt-2 text-xs text-muted-foreground">
              API Endpoint: {apiBaseUrl}/auth/register
            </span>
          ) : (
            <span className="block mt-2 text-xs text-red-600">
              Missing NEXT_PUBLIC_API_BASE_URL in .env.local. Falling back to "http://localhost:8081".
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
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !apiBaseUrl || !formData.email || !formData.password || !formData.confirmPassword}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
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
