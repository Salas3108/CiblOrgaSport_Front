"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Flag, RefreshCw } from "lucide-react"
import { toast } from "sonner"

// Interface mise à jour pour correspondre au backend
interface Equipe {
  id: number
  nom: string
  pays: string
  // Ancien format (gardé pour compatibilité)
  athleteIds?: number[]
  // Nouveau format du backend
  athleteIdUsernameMap?: Record<number, string>
}

interface Athlete {
  id: number
  username?: string | null
  nom: string
  prenom: string
  equipeNom?: string | null
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

const getAuthHeaders = () => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" }
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    : { "Content-Type": "application/json" }
}

export default function CommissaireEquipesPage() {
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEquipeId, setSelectedEquipeId] = useState("")
  const [selectedAthleteId, setSelectedAthleteId] = useState("")
  const [newEquipeNom, setNewEquipeNom] = useState("")
  const [newEquipePays, setNewEquipePays] = useState("")

  // Fonction utilitaire pour compter les athlètes
  const getAthleteCount = (equipe: Equipe): number => {
    // Nouveau format (athleteIdUsernameMap)
    if (equipe.athleteIdUsernameMap) {
      return Object.keys(equipe.athleteIdUsernameMap).length
    }
    // Ancien format (athleteIds) pour compatibilité
    if (equipe.athleteIds && Array.isArray(equipe.athleteIds)) {
      return equipe.athleteIds.length
    }
    return 0
  }

  const fetchEquipes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/commissaire/equipes`, {
        headers: getAuthHeaders()
      })
      if (!response.ok) throw new Error("Erreur lors du chargement des equipes")

      const data = await response.json()
      
      // Log pour debug - à supprimer en production
      console.log("Données reçues:", data)
      
      const equipesData: Equipe[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.equipes)
          ? data.equipes
          : []

      setEquipes(equipesData)
    } catch (error) {
      toast.error("Erreur de chargement des equipes")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const enrichAthletesWithUsername = async (items: Athlete[]) => {
    const enriched = await Promise.all(items.map(async (athlete) => {
      if (athlete.username) return athlete
      try {
        const response = await fetch(`${API_BASE_URL}/auth/user/${athlete.id}`, {
          headers: getAuthHeaders()
        })
        if (!response.ok) return athlete
        const data = await response.json()
        return { ...athlete, username: data?.username || athlete.username }
      } catch {
        return athlete
      }
    }))
    return enriched
  }

  const fetchAthletes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/commissaire/athletes`, {
        headers: getAuthHeaders()
      })
      if (!response.ok) throw new Error("Erreur lors du chargement des athletes")

      const data = await response.json()
      const athletesData: Athlete[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.athletes)
          ? data.athletes
          : []

      const enriched = await enrichAthletesWithUsername(athletesData)
      setAthletes(enriched)
    } catch (error) {
      toast.error("Erreur de chargement des athletes")
      console.error(error)
    }
  }

  useEffect(() => {
    fetchEquipes()
    fetchAthletes()
  }, [])

  const filteredEquipes = equipes.filter((equipe) => {
    const term = searchTerm.toLowerCase()
    return (
      equipe.nom.toLowerCase().includes(term) ||
      equipe.pays.toLowerCase().includes(term)
    )
  })

  const handleAssignAthlete = async () => {
    if (!selectedEquipeId || !selectedAthleteId) {
      toast.error("Equipe et athlete sont obligatoires")
      return
    }
    try {
      setAssigning(true)
      const response = await fetch(`${API_BASE_URL}/commissaire/equipes/${selectedEquipeId}/athletes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ athleteIds: [Number(selectedAthleteId)] })
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erreur réponse:", errorText)
        throw new Error("Erreur lors de l'assignation")
      }

      toast.success("Athlete assigne avec succes")
      setSelectedAthleteId("")
      await fetchEquipes()
      await fetchAthletes()
    } catch (error) {
      toast.error("Erreur lors de l'assignation")
      console.error(error)
    } finally {
      setAssigning(false)
    }
  }

  const handleCreateEquipe = async () => {
    if (!newEquipeNom.trim() || !newEquipePays.trim()) {
      toast.error("Nom et pays sont obligatoires")
      return
    }
    try {
      setCreating(true)
      const response = await fetch(`${API_BASE_URL}/commissaire/equipes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ nom: newEquipeNom.trim(), pays: newEquipePays.trim() })
      })
      if (!response.ok) throw new Error("Erreur lors de la creation de l'equipe")

      let createdEquipe: Equipe | null = null
      try {
        createdEquipe = await response.json()
      } catch {
        createdEquipe = null
      }

      if (createdEquipe && createdEquipe.id) {
        setEquipes((prev) => {
          const exists = prev.some((equipe) => equipe.id === createdEquipe?.id)
          if (exists) return prev.map((equipe) => equipe.id === createdEquipe?.id ? createdEquipe as Equipe : equipe)
          return [...prev, createdEquipe as Equipe]
        })
        setSelectedEquipeId(String(createdEquipe.id))
      }

      toast.success("Equipe creee avec succes")
      setNewEquipeNom("")
      setNewEquipePays("")
      await fetchEquipes()
    } catch (error) {
      toast.error("Erreur lors de la creation de l'equipe")
      console.error(error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteEquipe = async (equipe: Equipe) => {
    const confirmed = window.confirm(`Supprimer l'equipe "${equipe.nom}" ?`)
    if (!confirmed) return
    try {
      setDeletingId(equipe.id)
      const response = await fetch(`${API_BASE_URL}/commissaire/equipes/${equipe.id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      })
      if (!response.ok) throw new Error("Erreur lors de la suppression")

      toast.success("Equipe supprimee avec succes")
      await fetchEquipes()
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'equipe")
      console.error(error)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Gestion d'equipe</h1>
              <p className="text-muted-foreground mt-1">
                Suivi des equipes et des athletes associes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              <Badge variant="outline" className="text-sm">
                Commissaire
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Creer une equipe</CardTitle>
              <CardDescription>Ajouter une nouvelle equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    placeholder="Nom de l'equipe"
                    value={newEquipeNom}
                    onChange={(e) => setNewEquipeNom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pays</Label>
                  <Input
                    placeholder="Pays"
                    value={newEquipePays}
                    onChange={(e) => setNewEquipePays(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleCreateEquipe} disabled={creating} className="w-full">
                    {creating ? "Creation..." : "Creer"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigner un athlete</CardTitle>
              <CardDescription>Associer un athlete a une equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Equipe</Label>
                  <Select value={selectedEquipeId} onValueChange={setSelectedEquipeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une equipe" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipes.map((equipe) => (
                        <SelectItem key={equipe.id} value={String(equipe.id)}>
                          {equipe.nom} ({getAthleteCount(equipe)} athlète{getAthleteCount(equipe) > 1 ? 's' : ''})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Athlete</Label>
                  <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un athlete" />
                    </SelectTrigger>
                    <SelectContent>
                      {athletes.map((athlete) => (
                        <SelectItem key={athlete.id} value={String(athlete.id)}>
                          {(athlete.prenom || athlete.nom)
                            ? `${athlete.prenom ?? ""} ${athlete.nom ?? ""}`.trim()
                            : (athlete.username || "Athlete")}
                          {athlete.equipeNom ? ` (${athlete.equipeNom})` : " (Individuel)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAssignAthlete} disabled={assigning} className="w-full">
                    {assigning ? "Assignation..." : "Assigner"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipes</CardTitle>
              <CardDescription>Liste des equipes disponibles</CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      placeholder="Rechercher une equipe..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Button variant="outline" onClick={fetchEquipes}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rafraichir
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Chargement des equipes...</p>
                  </div>
                </div>
              ) : filteredEquipes.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="mt-2 text-muted-foreground">Aucune equipe trouvee</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Pays</TableHead>
                      <TableHead>Athlètes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEquipes.map((equipe) => {
                      const athleteCount = getAthleteCount(equipe)
                      return (
                        <TableRow key={equipe.id}>
                          <TableCell className="font-medium">{equipe.nom}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Flag className="h-4 w-4" />
                              {equipe.pays}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{athleteCount}</span>
                              {equipe.athleteIdUsernameMap && athleteCount > 0 && (
                                <Badge 
                                  variant="outline" 
                                  className="cursor-help text-xs"
                                  title={Object.entries(equipe.athleteIdUsernameMap)
                                    .map(([id, username]) => `ID ${id}: ${username || 'Sans username'}`)
                                    .join('\n')}
                                >
                                  👥
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteEquipe(equipe)}
                              disabled={deletingId === equipe.id}
                            >
                              {deletingId === equipe.id ? "Suppression..." : "Supprimer"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}