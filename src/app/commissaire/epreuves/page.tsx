"use client"

import { useEffect, useMemo, useState } from "react"
import { Header } from "@/components/header"
import eventsService from "@/src/api/eventsService"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, MapPin, RefreshCw, Trophy, Users } from "lucide-react"
import { toast } from "sonner"

interface Athlete {
  id: number
  username?: string | null
  nom: string
  prenom: string
  equipeNom?: string | null
}

interface Epreuve {
  id: number
  nom: string
  description?: string | null
  // Données du backend
  dateHeure?: string
  dureeMinutes?: number
  lieuId?: number
  // Données calculées pour compatibilité
  date?: string | null
  heureDebut?: string | null
  heureFin?: string | null
  lieu?: { id?: number; nom?: string | null } | null
  lieu_id?: number | null
  idLieu?: number | null
  lieuNom?: string | null
  nomLieu?: string | null
  lieuName?: string | null
}

// Fonction pour normaliser une épreuve du backend
const normalizeEpreuve = (epreuve: any): Epreuve => {
  const extractDate = (dateHeure?: string): string | null => {
    if (!dateHeure) return null
    try {
      return dateHeure.split('T')[0]
    } catch {
      return null
    }
  }

  const extractHeureDebut = (dateHeure?: string): string | null => {
    if (!dateHeure) return null
    try {
      const timePart = dateHeure.split('T')[1]
      return timePart ? timePart.substring(0, 5) : null
    } catch {
      return null
    }
  }

  const calculateHeureFin = (dateHeure?: string, dureeMinutes?: number): string | null => {
    if (!dateHeure || !dureeMinutes) return null
    try {
      const dt = new Date(dateHeure)
      dt.setMinutes(dt.getMinutes() + dureeMinutes)
      return dt.toTimeString().substring(0, 5)
    } catch {
      return null
    }
  }

  return {
    ...epreuve,
    date: epreuve.date || extractDate(epreuve.dateHeure),
    heureDebut: epreuve.heureDebut || extractHeureDebut(epreuve.dateHeure),
    heureFin: epreuve.heureFin || calculateHeureFin(epreuve.dateHeure, epreuve.dureeMinutes),
    lieu: epreuve.lieu || (epreuve.lieuId ? { id: epreuve.lieuId, nom: null } : null)
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

// Vérifier la configuration au chargement
if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn("⚠️ NEXT_PUBLIC_API_BASE_URL n'est pas défini. Utilisation du fallback:", API_BASE_URL)
  console.warn("💡 Redémarrez le serveur Next.js si vous venez de créer le fichier .env.local")
}

const getAuthHeaders = () => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" }
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("accessToken")
  return token
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    : { "Content-Type": "application/json" }
}

const formatDate = (date?: string | null) => (date ? new Date(date).toLocaleDateString("fr-FR") : "")
const formatTime = (time?: string | null) => (time ? time.slice(0, 5) : "")

export default function CommissaireEpreuvesPage() {
  const [epreuves, setEpreuves] = useState<Epreuve[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loadingEpreuves, setLoadingEpreuves] = useState(true)
  const [loadingAthletes, setLoadingAthletes] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEpreuveId, setSelectedEpreuveId] = useState("")
  const [selectedAthleteId, setSelectedAthleteId] = useState("")
  const [assignments, setAssignments] = useState<Record<number, number[]>>({})

  const getAthleteDisplayName = (athlete: Athlete) => {
    const fullName = `${athlete.prenom ?? ""} ${athlete.nom ?? ""}`.trim()
    return fullName || athlete.username?.trim() || "Athlete"
  }

  const getEquipeLabel = (athlete: Athlete) => athlete.equipeNom?.trim() ? athlete.equipeNom : "Individuel"

  const fetchEpreuves = async () => {
    try {
      setLoadingEpreuves(true)
      const data = await eventsService.getEpreuves().catch(() => [])
      const epreuvesData: Epreuve[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.epreuves)
          ? data.epreuves
          : []
      
      // Normaliser les épreuves pour avoir date, heureDebut, heureFin
      const normalizedEpreuves = epreuvesData.map(normalizeEpreuve)
      console.log("✅ Épreuves normalisées:", normalizedEpreuves)
      setEpreuves(normalizedEpreuves)
    } catch (error) {
      toast.error("Erreur de chargement des epreuves")
      console.error(error)
    } finally {
      setLoadingEpreuves(false)
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
      setLoadingAthletes(true)
      const url = `${API_BASE_URL}/api/commissaire/athletes`
      console.log("📡 Chargement des athlètes depuis:", url)
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      })
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        console.error(`❌ Erreur HTTP ${response.status}:`, errorText)
        
        if (response.status === 401) {
          toast.error("Non authentifié. Veuillez vous reconnecter.")
          throw new Error("Non authentifié")
        }
        throw new Error(`Erreur ${response.status}: ${errorText.substring(0, 100)}`)
      }

      const data = await response.json()
      console.log("✅ Athlètes chargés:", data.length || 0, "athlètes")
      
      const athletesData: Athlete[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.athletes)
          ? data.athletes
          : []

      const enriched = await enrichAthletesWithUsername(athletesData)
      setAthletes(enriched)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
      
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        toast.error("Impossible d'atteindre le serveur. Vérifiez que le backend est démarré sur le port 8080")
        console.error("❌ Erreur réseau. Backend accessible sur http://localhost:8080 ?")
      } else {
        toast.error(`Erreur de chargement des athlètes: ${errorMessage}`)
      }
      console.error("❌ Erreur complète:", error)
    } finally {
      setLoadingAthletes(false)
    }
  }

  const normalizeAssignments = (raw: Record<string, number[]>) => {
    const normalized: Record<number, number[]> = {}
    Object.entries(raw || {}).forEach(([key, value]) => {
      const parsedId = Number(key)
      if (!Number.isNaN(parsedId)) {
        normalized[parsedId] = Array.isArray(value) ? value : []
      }
    })
    return normalized
  }

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/commissaire/epreuves/assignments`, {
        headers: getAuthHeaders()
      })
      if (!response.ok) {
        const details = await response.text().catch(() => "")
        throw new Error(`Erreur lors du chargement des assignations (${response.status}) ${details}`.trim())
      }
      const data = await response.json()
      const assignmentsData = data?.assignments ?? data
      setAssignments(normalizeAssignments(assignmentsData))
    } catch (error) {
      toast.error("Erreur de chargement des assignations")
      console.error(error)
    }
  }

  useEffect(() => {
    fetchEpreuves()
    fetchAthletes()
    fetchAssignments()
  }, [])

  const filteredEpreuves = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return epreuves.filter((epreuve) => {
      const name = epreuve.nom?.toLowerCase() || ""
      return name.includes(term)
    })
  }, [epreuves, searchTerm])

  const getLieuName = (epreuve: Epreuve) => {
    const directName = epreuve.lieu?.nom?.trim()
    if (directName) return directName
    const inlineName = (epreuve.lieuNom || epreuve.nomLieu || epreuve.lieuName || "").trim()
    return inlineName
  }

  const handleAssignAthlete = async () => {
    if (!selectedEpreuveId || !selectedAthleteId) {
      toast.error("Epreuve et athlete sont obligatoires")
      return
    }

    try {
      setAssigning(true)
      const epreuveId = Number(selectedEpreuveId)
      const athleteId = Number(selectedAthleteId)
      const response = await fetch(`${API_BASE_URL}/api/commissaire/epreuves/${epreuveId}/athletes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ athleteIds: [athleteId] })
      })
      if (!response.ok) {
        const details = await response.text().catch(() => "")
        throw new Error(`Erreur lors de l'assignation (${response.status}) ${details}`.trim())
      }
      await fetchAssignments()
      toast.success("Assignation enregistree")
      setSelectedAthleteId("")
    } catch (error) {
      toast.error("Erreur lors de l'assignation")
      console.error(error)
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Assignation d'epreuves</h1>
              <p className="text-muted-foreground mt-1">
                Associer des athletes a des epreuves
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              <Badge variant="outline" className="text-sm">
                Commissaire
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assigner un athlete</CardTitle>
              <CardDescription>Associer un athlete a une epreuve</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Epreuve</Label>
                  <Select value={selectedEpreuveId} onValueChange={setSelectedEpreuveId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une epreuve" />
                    </SelectTrigger>
                    <SelectContent>
                      {epreuves.map((epreuve) => (
                        <SelectItem key={epreuve.id} value={String(epreuve.id)}>
                          {epreuve.nom}
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
                          {getAthleteDisplayName(athlete)}
                          {` (${getEquipeLabel(athlete)})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAssignAthlete}
                    disabled={assigning || loadingAthletes || loadingEpreuves}
                    className="w-full"
                  >
                    {assigning ? "Assignation..." : "Assigner"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Epreuves</CardTitle>
              <CardDescription>Liste des epreuves disponibles</CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <div className="flex-1">
                  <Input
                    placeholder="Rechercher une epreuve..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={fetchEpreuves} disabled={loadingEpreuves}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rafraichir
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingEpreuves ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Chargement des epreuves...</p>
                  </div>
                </div>
              ) : filteredEpreuves.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="mt-2 text-muted-foreground">Aucune epreuve trouvee</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Epreuve</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Lieu</TableHead>
                      <TableHead>Athletes assignes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEpreuves.map((epreuve) => {
                      const assignedCount = assignments[epreuve.id]?.length ?? 0
                      return (
                        <TableRow key={epreuve.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4" />
                              <span>{epreuve.nom}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {epreuve.date ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {formatDate(epreuve.date)}
                                  {epreuve.heureDebut && epreuve.heureFin
                                    ? ` — ${formatTime(epreuve.heureDebut)} → ${formatTime(epreuve.heureFin)}`
                                    : ""}
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {getLieuName(epreuve) ? (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{getLieuName(epreuve)}</span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {assignedCount}
                            </div>
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
