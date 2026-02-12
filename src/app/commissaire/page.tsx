"use client"
import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import Link from "next/link"
//import { ProtectedRoute } from "@/components/auth/protected-route"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  ClipboardCheck, 
  Trophy, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  FileText, 
  User, 
  Search,
  Filter,
  Download,
  Eye,
  MessageSquare,
  Mail,
  Phone,
  Calendar,
  Flag,
  Shield
} from "lucide-react"
import { toast } from "sonner"

interface Athlete {
  id: number
  username?: string | null
  nom: string
  prenom: string
  dateNaissance: string
  pays: string
  valide: boolean
  equipeNom?: string | null
  docs: {
    certificatMedical: string | null
    passport: string | null
  }
  observation: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

const getAuthHeaders = () => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" }
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  return token
    ? { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    : { "Content-Type": "application/json" }
}

export default function OfficialPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [validationDialogOpen, setValidationDialogOpen] = useState(false)
  const [messageDialogOpen, setMessageDialogOpen] = useState(false)
  const [refusalReason, setRefusalReason] = useState("")
  const [messageContent, setMessageContent] = useState("")
  const [viewDocumentsDialogOpen, setViewDocumentsDialogOpen] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    validated: 0,
    pending: 0,
    refused: 0
  })

  const getEquipeLabel = (athlete: Athlete) => athlete.equipeNom?.trim() ? athlete.equipeNom : "Individuel"
  const getAthleteDisplayName = (athlete: Athlete) => {
    const fullName = `${athlete.prenom ?? ""} ${athlete.nom ?? ""}`.trim()
    if (fullName) return fullName
    return athlete.username?.trim() || "Athlete"
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

  // Charger tous les athlètes
  const fetchAthletes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/commissaire/athletes`, {
        headers: getAuthHeaders()
      })
      if (!response.ok) throw new Error("Erreur lors du chargement des athlètes")
      
      const data = await response.json()
      const athletesData: Athlete[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.athletes)
          ? data.athletes
          : []

      const enriched = await enrichAthletesWithUsername(athletesData)
      setAthletes(enriched)

      // Calculer les statistiques
      const total = enriched.length
      const validated = enriched.filter((a: Athlete) => a.valide).length
      const pending = enriched.filter((a: Athlete) => !a.valide).length

      setStats({
        total,
        validated,
        pending,
        refused: 0 // À ajuster si vous avez un champ spécifique pour les refus
      })
    } catch (error) {
      toast.error("Erreur de chargement des athlètes")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAthletes()
  }, [])

  // Filtrer les athlètes
  const filteredAthletes = athletes.filter(athlete => {
    const fullName = getAthleteDisplayName(athlete).toLowerCase()
    const equipeLabel = getEquipeLabel(athlete).toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
               athlete.pays.toLowerCase().includes(searchTerm.toLowerCase()) ||
               equipeLabel.includes(searchTerm.toLowerCase())
    
    if (filterStatus === "all") return matchesSearch
    if (filterStatus === "validated") return matchesSearch && athlete.valide
    if (filterStatus === "pending") return matchesSearch && !athlete.valide
    
    return matchesSearch
  })

  // Valider un athlète
  const handleValidateAthlete = async (athleteId: number, valide: boolean, reason?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/commissaire/validation`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: athleteId,
          valide,
          motif: reason
        })
      })
      
      if (!response.ok) throw new Error("Erreur lors de la validation")
      
      const data = await response.json()
      if (data.success) {
        toast.success(valide ? "Athlète validé avec succès" : "Athlète refusé avec succès")
        setValidationDialogOpen(false)
        setRefusalReason("")
        fetchAthletes() // Rafraîchir la liste
        
        // Réinitialiser l'athlète sélectionné
        if (selectedAthlete?.id === athleteId) {
          setSelectedAthlete(data.athlete)
        }
      }
    } catch (error) {
      toast.error("Erreur lors de la validation")
      console.error(error)
    }
  }

  // Envoyer un message à un athlète
  const handleSendMessage = async () => {
    if (!selectedAthlete || !messageContent.trim()) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/commissaire/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: selectedAthlete.id,
          message: messageContent.trim()
        })
      })
      
      if (!response.ok) throw new Error("Erreur lors de l'envoi du message")
      
      const data = await response.json()
      if (data.success) {
        toast.success("Message envoyé avec succès")
        setMessageDialogOpen(false)
        setMessageContent("")
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi du message")
      console.error(error)
    }
  }

  // Ouvrir les documents d'un athlète
  const handleViewDocuments = async (athleteId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/commissaire/doc/${athleteId}`, {
        headers: getAuthHeaders()
      })
      if (!response.ok) throw new Error("Erreur lors du chargement des documents")
      
      const data = await response.json()
      if (data.success) {
        const athlete = athletes.find(a => a.id === athleteId)
        if (athlete) {
          setSelectedAthlete(athlete)
          setViewDocumentsDialogOpen(true)
        }
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des documents")
      console.error(error)
    }
  }

  // Télécharger un document
  const handleDownloadDocument = (filename: string | null, type: string) => {
    if (!filename) {
      toast.error("Document non disponible")
      return
    }
    
    // Simuler le téléchargement
    toast.info(`Téléchargement du ${type}...`)
    const link = document.createElement('a')
    link.href = `#`
    link.download = filename
    link.click()
  }

  return (
    //<ProtectedRoute allowedRoles={["official"]}>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">Tableau de bord - Commissaire</h1>
                <p className="text-muted-foreground mt-1">
                  Gestion des inscriptions et validation des athlètes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <Badge variant="outline" className="text-sm">
                  Commissaire
                </Badge>
              </div>
            </div>


            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Athlètes</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <User className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Validés</p>
                      <p className="text-2xl font-bold">{stats.validated}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">En attente</p>
                      <p className="text-2xl font-bold">{stats.pending}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Refusés</p>
                      <p className="text-2xl font-bold">{stats.refused}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contenu principal */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Liste des athlètes */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Athlètes inscrits</CardTitle>
                    <CardDescription>
                      Liste des athlètes à valider ou refuser
                    </CardDescription>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Rechercher un athlète..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="validated">Validés</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-2 text-muted-foreground">Chargement des athlètes...</p>
                        </div>
                      </div>
                    ) : filteredAthletes.length === 0 ? (
                      <div className="text-center py-12">
                        <User className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="mt-2 text-muted-foreground">Aucun athlète trouvé</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredAthletes.map((athlete) => (
                          <div
                            key={athlete.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedAthlete?.id === athlete.id
                                ? 'bg-primary/10 border-primary'
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => setSelectedAthlete(athlete)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {getAthleteDisplayName(athlete)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {athlete.pays} • {athlete.dateNaissance} • {getEquipeLabel(athlete)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={athlete.valide ? "default" : "destructive"}>
                                  {athlete.valide ? (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Validé
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3 mr-1" />
                                      En attente
                                    </>
                                  )}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewDocuments(athlete.id)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {athlete.observation && (
                              <div className="mt-3 pt-3 border-t">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                                  <p className="text-sm text-muted-foreground">
                                    {athlete.observation}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Détails de l'athlète sélectionné */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Détails de l'athlète</CardTitle>
                    <CardDescription>
                      {selectedAthlete ? `Informations de ${selectedAthlete.prenom} ${selectedAthlete.nom}` : "Sélectionnez un athlète"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedAthlete ? (
                      <div className="space-y-6">
                        {/* Informations personnelles */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-muted-foreground">Nom</Label>
                              <div className="font-medium">{selectedAthlete.nom || "-"}</div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Prénom</Label>
                              <div className="font-medium">{selectedAthlete.prenom || "-"}</div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Username</Label>
                              <div className="font-medium">{selectedAthlete.username || "-"}</div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Date de naissance</Label>
                              <div className="font-medium">{selectedAthlete.dateNaissance}</div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Pays</Label>
                              <div className="font-medium flex items-center gap-2">
                                <Flag className="h-4 w-4" />
                                {selectedAthlete.pays}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Équipe</Label>
                              <div className="font-medium">{getEquipeLabel(selectedAthlete)}</div>
                            </div>
                          </div>
                          
                          {selectedAthlete.observation && (
                            <div>
                              <Label className="text-sm text-muted-foreground">Observation</Label>
                              <Alert className="mt-1">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  {selectedAthlete.observation}
                                </AlertDescription>
                              </Alert>
                            </div>
                          )}
                        </div>

                        {/* Documents */}
                        <div className="space-y-3">
                          <Label className="text-sm text-muted-foreground">Documents</Label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">Certificat Médical</div>
                                  <div className="text-sm text-muted-foreground">
                                    {selectedAthlete.docs.certificatMedical || "Non fourni"}
                                  </div>
                                </div>
                              </div>
                              {selectedAthlete.docs.certificatMedical && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownloadDocument(selectedAthlete.docs.certificatMedical, "certificat médical")}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">Passeport</div>
                                  <div className="text-sm text-muted-foreground">
                                    {selectedAthlete.docs.passport || "Non fourni"}
                                  </div>
                                </div>
                              </div>
                              {selectedAthlete.docs.passport && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownloadDocument(selectedAthlete.docs.passport, "passeport")}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-4 border-t">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleValidateAthlete(selectedAthlete.id, true)}
                              disabled={selectedAthlete.valide}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Valider
                            </Button>
                            
                            <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  className="flex-1"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Refuser
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Refuser l'athlète</DialogTitle>
                                  <DialogDescription>
                                    Veuillez indiquer le motif du refus pour {selectedAthlete.prenom} {selectedAthlete.nom}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Textarea
                                    placeholder="Motif du refus (ex: Passeport expiré, certificat médical manquant, informations incomplètes...)"
                                    value={refusalReason}
                                    onChange={(e) => setRefusalReason(e.target.value)}
                                    rows={4}
                                  />
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setValidationDialogOpen(false)}
                                  >
                                    Annuler
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleValidateAthlete(selectedAthlete.id, false, refusalReason)}
                                    disabled={!refusalReason.trim()}
                                  >
                                    Confirmer le refus
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                          
                          <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Envoyer un message
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Envoyer un message</DialogTitle>
                                <DialogDescription>
                                  Message à {selectedAthlete.prenom} {selectedAthlete.nom}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Votre message (ex: Votre passeport est expiré, veuillez fournir un nouveau document...)"
                                  value={messageContent}
                                  onChange={(e) => setMessageContent(e.target.value)}
                                  rows={4}
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setMessageDialogOpen(false)}
                                >
                                  Annuler
                                </Button>
                                <Button
                                  onClick={handleSendMessage}
                                  disabled={!messageContent.trim()}
                                >
                                  Envoyer le message
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <User className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="mt-2 text-muted-foreground">
                          Sélectionnez un athlète dans la liste pour voir ses détails
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions rapides */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Actions rapides</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={fetchAthletes}
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Rafraîchir la liste
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setSearchTerm("")
                        setFilterStatus("all")
                      }}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Réinitialiser les filtres
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
   // </ProtectedRoute>
  )
}
