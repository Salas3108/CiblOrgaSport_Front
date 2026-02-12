"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Users, AlertCircle } from "lucide-react"

interface Coequipier {
  id: number
  nom: string
  prenom: string
  pays: string
  role?: string
  username?: string | null
}

interface Equipe {
  id: number
  nom: string
  members: Coequipier[]
  categorie?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

const getAuthHeaders = () => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" }
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    : { "Content-Type": "application/json" }
}

const getUserIdFromToken = (): number | null => {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  if (!token) return null
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    const data = JSON.parse(json)
    const candidate = data.userId ?? data.id ?? data.sub
    const n = Number(candidate)
    if (!Number.isNaN(n) && Number.isFinite(n)) return Math.trunc(n)
    return null
  } catch {
    return null
  }
}

const getUsernameFromToken = (): string | null => {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  if (!token) return null
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    )
    const data = JSON.parse(json)
    return data.sub || data.username || null
  } catch {
    return null
  }
}

function getUserIdFromStorage(): number | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("user")
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const candidate = parsed.id ?? parsed.userId ?? parsed.sub ?? parsed.spectatorId
    const n = Number(candidate)
    if (!Number.isNaN(n) && Number.isFinite(n)) return Math.trunc(n)
    const s = String(candidate ?? "")
    const m = s.match(/(\d+)/)
    return m ? Number(m[1]) : null
  } catch {
    return null
  }
}

export default function MonEquipePage() {
  const [equipe, setEquipe] = useState<Equipe | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [athleteId, setAthleteId] = useState<number>(1)

  useEffect(() => {
    const loadForCurrentUser = async () => {
      let id: number | null = null
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: getAuthHeaders()
        })
        if (response.ok) {
          const data = await response.json()
          id = Number(data?.id)
        }
      } catch {
        id = null
      }
      if (!id || Number.isNaN(id)) {
        id = getUserIdFromToken()
      }
      if (!id || Number.isNaN(id)) {
        id = getUserIdFromStorage()
      }
      if (!id) id = 1
      setAthleteId(id)
      loadEquipe(id)
    }

    loadForCurrentUser()
  }, [])

  const loadEquipe = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE_URL}/api/athlete/${id}/equipe`, {
        headers: getAuthHeaders()
      })
      if (!res.ok) {
        setEquipe(null)
        setError(null)
        return
      }
      const data = await res.json()
      const hasEquipe = data && data.id
      setEquipe(hasEquipe ? data : null)
    } catch (err) {
      setError(null)
      setEquipe(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header />
      <main className="max-w-5xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Mon équipe</CardTitle>
            <CardDescription>Informations sur votre équipe et vos coéquipiers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">Chargement...</div>
            ) : error ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">{error}</p>
                <Button onClick={() => loadEquipe(athleteId)} className="mt-4">Réessayer</Button>
              </div>
            ) : !equipe ? (
              <div className="text-center py-8">
                <Badge variant="secondary" className="mb-4">Épreuve individuelle</Badge>
                <Users className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="mt-3 text-sm text-muted-foreground">Vous participez à une épreuve individuelle</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-br from-primary/10 to-background border rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{equipe.nom}</h3>
                  {equipe.categorie && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{equipe.categorie}</Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Coéquipiers ({equipe.members?.length || 0})</h4>
                  {equipe.members && equipe.members.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                      {equipe.members
                        .filter((member) => {
                          const currentUsername = getUsernameFromToken()
                          if (member.id && athleteId && member.id === athleteId) return false
                          if (currentUsername && member.username && member.username.toLowerCase() === currentUsername.toLowerCase()) return false
                          return true
                        })
                        .map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{member.prenom} {member.nom}</p>
                              {member.username && (
                                <p className="text-xs text-muted-foreground">{member.username}</p>
                              )}
                              <p className="text-sm text-muted-foreground">{member.pays}</p>
                            </div>
                          </div>
                          <Badge variant={member.role ? "secondary" : "outline"} className="ml-2">
                            {member.role ?? "Non spécifié"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">Aucun coéquipier pour le moment</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
