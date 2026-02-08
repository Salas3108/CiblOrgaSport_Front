"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Flag, 
  Cake, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Upload,
  Download,
  MessageSquare,
  Edit,
  Save,
  X
} from "lucide-react"

interface Athlete {
  id: number
  nom: string
  prenom: string
  dateNaissance: string
  pays: string
  valide: boolean
  docs: {
    certificatMedical: string | null
    passport: string | null
  }
  observation: string
}

interface CommissaireMessage {
  id: number
  athleteId: number
  date: string
  message: string
  expediteur: string
  lu: boolean
}

interface AthleteEpreuve {
  id: number
  nom: string
  type: string
  niveau: string
  date: string
  heureDebut: string
  heureFin: string
  lieu: string
}

const API_BASE_URL = "http://localhost:3001"

export default function AthletePage() {
  const [athlete, setAthlete] = useState<Athlete | null>(null)
  const [messages, setMessages] = useState<CommissaireMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [epreuves, setEpreuves] = useState<AthleteEpreuve[]>([])
  const [epreuvesLoading, setEpreuvesLoading] = useState(false)
  const [epreuvesError, setEpreuvesError] = useState<string | null>(null)
  
  // États pour l'édition
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    pays: "",
    observation: ""
  })
  
  // États pour les documents
  const [uploading, setUploading] = useState(false)
  const [documentType, setDocumentType] = useState<'certificatMedical' | 'passport'>('certificatMedical')
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  
  // États pour la validation (commissaire)
  const [isCommissaireMode, setIsCommissaireMode] = useState(false)
  const [validationMotif, setValidationMotif] = useState("")
  const [newMessage, setNewMessage] = useState("")
  
  // États pour la liste des athlètes (commissaire)
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([])
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null)

  // Charger l'athlète par défaut (ID 1)
  const loadAthlete = async (id: number) => {
    try {
      setLoading(true)
      setError(null)
      
      // Récupérer les informations de l'athlète
      const response = await fetch(`${API_BASE_URL}/api/commissaire/info/${id}`)
      if (!response.ok) throw new Error("Erreur lors du chargement de l'athlète")
      
      const data = await response.json()
      if (data.success && data.athlete) {
        setAthlete(data.athlete)
        setEditForm({
          nom: data.athlete.nom,
          prenom: data.athlete.prenom,
          dateNaissance: data.athlete.dateNaissance,
          pays: data.athlete.pays,
          observation: data.athlete.observation
        })
      }
      
      // Récupérer les messages
      const messagesResponse = await fetch(`${API_BASE_URL}/api/commissaire/messages/${id}`)
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        if (messagesData.success) {
          setMessages(messagesData.messages || [])
        }
      }

      await loadEpreuves(id)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      console.error("Erreur:", err)
    } finally {
      setLoading(false)
    }
  }

  const loadEpreuves = async (id: number) => {
    try {
      setEpreuvesLoading(true)
      setEpreuvesError(null)

      const response = await fetch(`/api/athletes/${id}/epreuves`)
      if (!response.ok) throw new Error("Erreur lors du chargement des épreuves")

      const data = await response.json()
      const list = Array.isArray(data) ? data : data.epreuves || []
      setEpreuves(list)
    } catch (err) {
      setEpreuvesError(err instanceof Error ? err.message : "Erreur inconnue")
      setEpreuves([])
    } finally {
      setEpreuvesLoading(false)
    }
  }

  // Charger tous les athlètes (mode commissaire)
  const loadAllAthletes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/commissaire/athletes`)
      if (!response.ok) throw new Error("Erreur lors du chargement des athlètes")
      
      const data = await response.json()
      if (data.success && data.athletes) {
        setAllAthletes(data.athletes)
      }
    } catch (err) {
      console.error("Erreur:", err)
    }
  }

  useEffect(() => {
    loadAthlete(1) // Par défaut, charger l'athlète avec ID 1
  }, [])

  // Mettre à jour les informations de l'athlète
  const handleUpdateInfo = async () => {
    if (!athlete) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/athlete/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: athlete.id,
          ...editForm
        })
      })
      
      if (!response.ok) throw new Error("Erreur lors de la mise à jour")
      
      const data = await response.json()
      if (data.success) {
        setAthlete(data.athlete)
        setIsEditing(false)
        alert("Informations mises à jour avec succès!")
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour: " + (err instanceof Error ? err.message : "Erreur inconnue"))
    }
  }

  // Uploader un document
  const handleUploadDocument = async () => {
    if (!athlete || !documentFile) return
    
    try {
      setUploading(true)
      
      // Simuler l'upload - dans la réalité, vous enverriez le fichier
      const filename = `${documentType}_${athlete.prenom}_${athlete.nom}.pdf`
      
      const response = await fetch(`${API_BASE_URL}/api/athlete/doc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: athlete.id,
          type: documentType,
          filename: filename
        })
      })
      
      if (!response.ok) throw new Error("Erreur lors de l'upload")
      
      const data = await response.json()
      if (data.success) {
        setAthlete(data.athlete)
        setDocumentFile(null)
        alert("Document uploadé avec succès!")
      }
    } catch (err) {
      alert("Erreur lors de l'upload: " + (err instanceof Error ? err.message : "Erreur inconnue"))
    } finally {
      setUploading(false)
    }
  }

  // Ajouter une observation/remarque
  const handleAddObservation = async () => {
    if (!athlete) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/athlete/remarque`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: athlete.id,
          observation: editForm.observation
        })
      })
      
      if (!response.ok) throw new Error("Erreur lors de l'ajout de la remarque")
      
      const data = await response.json()
      if (data.success) {
        setAthlete(data.athlete)
        alert("Observation ajoutée avec succès!")
      }
    } catch (err) {
      alert("Erreur: " + (err instanceof Error ? err.message : "Erreur inconnue"))
    }
  }

  // Valider ou refuser l'athlète (commissaire)
  const handleValidation = async (valide: boolean) => {
    if (!athlete && !selectedAthleteId) return
    
    const targetId = selectedAthleteId || athlete?.id
    if (!targetId) return
    
    let motif = ""
    if (!valide) {
      motif = prompt("Motif de refus (ex: Passeport expiré, Certificat médical manquant):") || ""
      if (!motif) {
        alert("Un motif est requis pour le refus")
        return
      }
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/commissaire/validation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetId,
          valide,
          motif
        })
      })
      
      if (!response.ok) throw new Error("Erreur lors de la validation")
      
      const data = await response.json()
      if (data.success) {
        alert(data.message)
        
        // Recharger les données
        if (selectedAthleteId) {
          loadAthlete(selectedAthleteId)
          loadAllAthletes()
        } else {
          loadAthlete(athlete!.id)
        }
        
        setValidationMotif("")
      }
    } catch (err) {
      alert("Erreur: " + (err instanceof Error ? err.message : "Erreur inconnue"))
    }
  }

  // Envoyer un message (commissaire)
  const handleSendMessage = async () => {
    if (!athlete && !selectedAthleteId) return
    
    const targetId = selectedAthleteId || athlete?.id
    if (!targetId || !newMessage.trim()) return
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/commissaire/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: targetId,
          message: newMessage.trim()
        })
      })
      
      if (!response.ok) throw new Error("Erreur lors de l'envoi du message")
      
      const data = await response.json()
      if (data.success) {
        alert("Message envoyé avec succès!")
        setNewMessage("")
        
        // Recharger les messages
        const messagesResponse = await fetch(`${API_BASE_URL}/api/commissaire/messages/${targetId}`)
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          if (messagesData.success) {
            setMessages(messagesData.messages || [])
          }
        }
      }
    } catch (err) {
      alert("Erreur: " + (err instanceof Error ? err.message : "Erreur inconnue"))
    }
  }

  // Télécharger un document
  const handleDownloadDocument = (filename: string | null, type: string) => {
    if (!filename) {
      alert("Document non disponible")
      return
    }
    
    // Simuler le téléchargement
    alert(`Téléchargement du ${type}: ${filename}`)
    // Dans la réalité, vous feriez un lien vers le fichier
  }

  // Charger un athlète spécifique (commissaire)
  const handleSelectAthlete = async (id: number) => {
    setSelectedAthleteId(id)
    await loadAthlete(id)
  }

  const getDateTime = (date: string, time: string) => {
    return new Date(`${date}T${time}`)
  }

  const hasOverlap = (current: AthleteEpreuve, list: AthleteEpreuve[]) => {
    if (!current.heureDebut || !current.heureFin) return false
    const start = getDateTime(current.date, current.heureDebut).getTime()
    const end = getDateTime(current.date, current.heureFin).getTime()

    return list.some((other) => {
      if (other.id === current.id) return false
      if (other.date !== current.date) return false
      if (!other.heureDebut || !other.heureFin) return false

      const otherStart = getDateTime(other.date, other.heureDebut).getTime()
      const otherEnd = getDateTime(other.date, other.heureFin).getTime()
      return start < otherEnd && end > otherStart
    })
  }

  const sortedEpreuves = [...epreuves].sort((a, b) => {
    const aTime = getDateTime(a.date, a.heureDebut || "00:00").getTime()
    const bTime = getDateTime(b.date, b.heureDebut || "00:00").getTime()
    return aTime - bTime
  })

  const epreuvesByDate = sortedEpreuves.reduce<Record<string, AthleteEpreuve[]>>((acc, epreuve) => {
    if (!acc[epreuve.date]) {
      acc[epreuve.date] = []
    }
    acc[epreuve.date].push(epreuve)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement des données...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold mt-4">Erreur</h1>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button onClick={() => loadAthlete(1)} className="mt-4">
              Réessayer
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Mode switch Athlète/Commissaire */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              {isCommissaireMode ? "Mode Commissaire" : "Espace Athlète"}
            </h1>
            <Button 
              onClick={() => {
                setIsCommissaireMode(!isCommissaireMode)
                if (isCommissaireMode) {
                  setSelectedAthleteId(null)
                  loadAthlete(1)
                } else {
                  loadAllAthletes()
                }
              }}
              variant="outline"
            >
              {isCommissaireMode ? "Mode Athlète" : "Mode Commissaire"}
            </Button>
          </div>

          {isCommissaireMode ? (
            /* === MODE COMMISSAIRE === */
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Liste des athlètes */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Athlètes</CardTitle>
                    <CardDescription>
                      {allAthletes.length} athlètes enregistrés
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {allAthletes.map((athlete) => (
                        <div
                          key={athlete.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedAthleteId === athlete.id
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => handleSelectAthlete(athlete.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">
                                {athlete.prenom} {athlete.nom}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {athlete.pays}
                              </div>
                            </div>
                            <Badge variant={athlete.valide ? "default" : "destructive"}>
                              {athlete.valide ? "Validé" : "En attente"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Détails de l'athlète sélectionné */}
              <div className="lg:col-span-2 space-y-6">
                {selectedAthleteId && athlete ? (
                  <>
                    {/* Informations de l'athlète */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Informations de l'athlète</span>
                          <Badge variant={athlete.valide ? "default" : "destructive"}>
                            {athlete.valide ? "Validé" : "En attente"}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-muted-foreground">Nom</label>
                              <div className="font-medium">{athlete.nom}</div>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Prénom</label>
                              <div className="font-medium">{athlete.prenom}</div>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Date de naissance</label>
                              <div className="font-medium">{athlete.dateNaissance}</div>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Pays</label>
                              <div className="font-medium">{athlete.pays}</div>
                            </div>
                          </div>
                          
                          {athlete.observation && (
                            <div>
                              <label className="text-sm text-muted-foreground">Observation</label>
                              <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                {athlete.observation}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Documents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <div className="font-medium">Certificat Médical</div>
                              <div className="text-sm text-muted-foreground">
                                {athlete.docs.certificatMedical || "Non fourni"}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {athlete.docs.certificatMedical && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadDocument(athlete.docs.certificatMedical, "certificat médical")}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Télécharger
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <div className="font-medium">Passeport</div>
                              <div className="text-sm text-muted-foreground">
                                {athlete.docs.passport || "Non fourni"}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {athlete.docs.passport && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadDocument(athlete.docs.passport, "passeport")}
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Télécharger
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Actions du commissaire */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleValidation(true)}
                              disabled={athlete.valide}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Valider l'athlète
                            </Button>
                            <Button
                              onClick={() => handleValidation(false)}
                              variant="destructive"
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Refuser
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Message à l'athlète (ex: Passeport expiré, certficat manquant...)"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              rows={3}
                            />
                            <Button
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim()}
                              className="w-full"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Envoyer un message
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-12">
                      <div className="text-center">
                        <User className="h-12 w-12 text-muted-foreground mx-auto" />
                        <h3 className="mt-4 font-medium">Sélectionnez un athlète</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Cliquez sur un athlète dans la liste pour voir ses informations
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            /* === MODE ATHLÈTE === */
            athlete && (
              <div className="space-y-6">
                {/* En-tête du profil */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">{athlete.prenom} {athlete.nom}</h1>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Flag className="h-4 w-4" />
                          <span>{athlete.pays}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Cake className="h-4 w-4" />
                          <span>{athlete.dateNaissance}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant={athlete.valide ? "default" : "destructive"}>
                          {athlete.valide ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Validé
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              En attente de validation
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setIsEditing(!isEditing)}
                      variant="outline"
                    >
                      {isEditing ? (
                        <X className="h-4 w-4 mr-2" />
                      ) : (
                        <Edit className="h-4 w-4 mr-2" />
                      )}
                      {isEditing ? "Annuler" : "Modifier"}
                    </Button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Informations personnelles */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Informations personnelles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Nom</label>
                              <Input
                                value={editForm.nom}
                                onChange={(e) => setEditForm({...editForm, nom: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Prénom</label>
                              <Input
                                value={editForm.prenom}
                                onChange={(e) => setEditForm({...editForm, prenom: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Date de naissance</label>
                              <Input
                                type="date"
                                value={editForm.dateNaissance}
                                onChange={(e) => setEditForm({...editForm, dateNaissance: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Pays</label>
                              <Input
                                value={editForm.pays}
                                onChange={(e) => setEditForm({...editForm, pays: e.target.value})}
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Observation</label>
                            <Textarea
                              value={editForm.observation}
                              onChange={(e) => setEditForm({...editForm, observation: e.target.value})}
                              rows={3}
                              placeholder="Ajoutez une observation..."
                            />
                          </div>
                          
                          <div className="flex gap-2 pt-4">
                            <Button onClick={handleUpdateInfo} className="flex-1">
                              <Save className="h-4 w-4 mr-2" />
                              Enregistrer
                            </Button>
                            <Button onClick={handleAddObservation} variant="outline" className="flex-1">
                              Ajouter observation
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-muted-foreground">Nom</label>
                              <div className="font-medium">{athlete.nom}</div>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Prénom</label>
                              <div className="font-medium">{athlete.prenom}</div>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Date de naissance</label>
                              <div className="font-medium">{athlete.dateNaissance}</div>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Pays</label>
                              <div className="font-medium">{athlete.pays}</div>
                            </div>
                          </div>
                          
                          {athlete.observation && (
                            <div>
                              <label className="text-sm text-muted-foreground">Observation</label>
                              <div className="mt-1 p-3 bg-muted rounded-lg">
                                {athlete.observation}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Documents */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Documents requis</CardTitle>
                      <CardDescription>
                        Téléchargez vos documents obligatoires
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Certificat Médical */}
                        <div className="space-y-4 p-4 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">Certificat Médical</h3>
                              <p className="text-sm text-muted-foreground">
                                {athlete.docs.certificatMedical || "Document non fourni"}
                              </p>
                            </div>
                            <Badge variant={athlete.docs.certificatMedical ? "outline" : "destructive"}>
                              {athlete.docs.certificatMedical ? "Fourni" : "Manquant"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setDocumentType('certificatMedical')
                                  setDocumentFile(e.target.files[0])
                                }
                              }}
                              className="hidden"
                              id="certificat-upload"
                            />
                            <label htmlFor="certificat-upload" className="flex-1">
                              <Button className="w-full" variant="outline" asChild>
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {athlete.docs.certificatMedical ? "Remplacer" : "Télécharger"}
                                </span>
                              </Button>
                            </label>
                            {athlete.docs.certificatMedical && (
                              <Button
                                onClick={() => handleDownloadDocument(athlete.docs.certificatMedical, "certificat médical")}
                                variant="outline"
                                className="flex-1"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Passeport */}
                        <div className="space-y-4 p-4 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">Passeport</h3>
                              <p className="text-sm text-muted-foreground">
                                {athlete.docs.passport || "Document non fourni"}
                              </p>
                            </div>
                            <Badge variant={athlete.docs.passport ? "outline" : "destructive"}>
                              {athlete.docs.passport ? "Fourni" : "Manquant"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setDocumentType('passport')
                                  setDocumentFile(e.target.files[0])
                                }
                              }}
                              className="hidden"
                              id="passport-upload"
                            />
                            <label htmlFor="passport-upload" className="flex-1">
                              <Button className="w-full" variant="outline" asChild>
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {athlete.docs.passport ? "Remplacer" : "Télécharger"}
                                </span>
                              </Button>
                            </label>
                            {athlete.docs.passport && (
                              <Button
                                onClick={() => handleDownloadDocument(athlete.docs.passport, "passeport")}
                                variant="outline"
                                className="flex-1"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Bouton d'upload si fichier sélectionné */}
                        {documentFile && (
                          <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span className="font-medium">{documentFile.name}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={handleUploadDocument}
                                disabled={uploading}
                                className="flex-1"
                              >
                                {uploading ? "Upload en cours..." : `Uploader ${documentType === 'certificatMedical' ? 'certificat médical' : 'passeport'}`}
                              </Button>
                              <Button
                                onClick={() => setDocumentFile(null)}
                                variant="outline"
                              >
                                Annuler
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Mes épreuves */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5" />
                      <span>Mes épreuves</span>
                    </CardTitle>
                    <CardDescription>
                      Calendrier et détails des épreuves programmées
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {epreuvesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-3 text-sm text-muted-foreground">Chargement des épreuves...</p>
                        </div>
                      </div>
                    ) : epreuvesError ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                        <p className="mt-3 text-sm text-muted-foreground">{epreuvesError}</p>
                        <Button onClick={() => loadEpreuves(athlete.id)} className="mt-4">
                          Réessayer
                        </Button>
                      </div>
                    ) : sortedEpreuves.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
                        <p className="mt-3 text-sm text-muted-foreground">
                          Aucune épreuve programmée pour le moment
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {Object.entries(epreuvesByDate).map(([date, items]) => (
                          <div key={date} className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(date).toLocaleDateString("fr-FR", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric"
                                })}
                              </span>
                            </div>
                            <div className="relative border-l pl-6 space-y-4">
                              {items.map((epreuve) => {
                                const overlap = hasOverlap(epreuve, items)
                                return (
                                  <div key={epreuve.id} className="relative">
                                    <div className="absolute -left-[9px] top-3 h-4 w-4 rounded-full border-2 border-primary bg-background"></div>
                                    <div className={`rounded-lg border p-4 ${overlap ? "border-red-300 bg-red-50/50" : "bg-card"}`}>
                                      <div className="flex items-start justify-between gap-4">
                                        <div>
                                          <h3 className="font-medium">{epreuve.nom}</h3>
                                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                              <Clock className="h-4 w-4" />
                                              {epreuve.heureDebut} - {epreuve.heureFin}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <MapPin className="h-4 w-4" />
                                              {epreuve.lieu}
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <Badge variant="outline">{epreuve.type}</Badge>
                                            <Badge variant="secondary">{epreuve.niveau}</Badge>
                                            {overlap && (
                                              <Badge variant="destructive" className="flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Chevauchement
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Messages du commissaire */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Messages du commissaire</span>
                      {messages.filter(m => !m.lu).length > 0 && (
                        <Badge variant="default" className="ml-2">
                          {messages.filter(m => !m.lu).length} nouveau(x)
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {messages.length > 0 ? (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-4 border rounded-lg ${!message.lu ? 'bg-blue-50 border-blue-200' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium">{message.expediteur}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(message.date).toLocaleDateString('fr-FR')}
                                </div>
                              </div>
                              {!message.lu && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                  Nouveau
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{message.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="mt-4 text-muted-foreground">
                          Aucun message pour le moment
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  )
}
