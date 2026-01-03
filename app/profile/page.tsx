"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type StoredUser = {
  username?: string
  email?: string
  role?: string
  name?: string
  authenticated?: boolean
}

export default function ProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null)
  const [tokenPreview, setTokenPreview] = useState<string | null>(null)

  useEffect(() => {
    try {
      const rawUser = typeof window !== "undefined" ? localStorage.getItem("user") : null
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (rawUser) {
        const parsed = JSON.parse(rawUser || "{}")
        setUser(parsed)
      } else {
        setUser(null)
      }
      setTokenPreview(token ? `${token.slice(0, 8)}...` : null)
    } catch {
      setUser(null)
      setTokenPreview(null)
    }
  }, [])

  if (!user?.authenticated) {
    return (
      <div className="max-w-xl mx-auto">
        <Alert className="mb-4">
          <AlertDescription>Vous n’êtes pas authentifié. Merci de vous connecter.</AlertDescription>
        </Alert>
        <Link href="/login">
          <Button>Se connecter</Button>
        </Link>
      </div>
    )
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>Profil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <span className="font-semibold">Nom d’utilisateur:</span> {user?.username || "-"}
        </div>
        <div className="text-sm">
          <span className="font-semibold">Nom affiché:</span> {user?.name || user?.username || "-"}
        </div>
        <div className="text-sm">
          <span className="font-semibold">Email:</span> {user?.email || "-"}
        </div>
        <div className="text-sm">
          <span className="font-semibold">Rôle:</span> {user?.role || "-"}
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold">Token:</span> {tokenPreview || "-"}
        </div>

        <div className="pt-4">
          <Link href="/">
            <Button variant="secondary">Retour à l’accueil</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
