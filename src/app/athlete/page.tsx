"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  X,
  Users,
} from "lucide-react";

interface Athlete {
  id: number;
  nom: string;
  prenom: string;
  dateNaissance: string;
  pays: string;
  valide: boolean;
  docs: {
    certificatMedicalUrl?: string | null;
    passportUrl?: string | null;
    certificatMedical?: string | null;
    passport?: string | null;
  };
  observation: string;
}

interface CommissaireMessage {
  id: number;
  athleteId: number;
  date: string;
  message: string;
  expediteur: string;
  lu: boolean;
}

interface AthleteEpreuve {
  id: number;
  nom: string;
  typeEpreuve: "INDIVIDUELLE" | "COLLECTIVE";
  niveauEpreuve: "QUALIFICATION" | "QUART_DE_FINALE" | "DEMI_FINALE" | "FINALE";
  genreEpreuve?: "FEMININ" | "MASCULIN" | "MIXTE";
  date: string;
  heureDebut: string;
  heureFin: string;
  lieu: { id?: number; nom?: string } | string;
}

interface Coequipier {
  id: number;
  nom: string;
  prenom: string;
  pays: string;
  role?: string;
  username?: string | null;
}

interface Equipe {
  id: number;
  nom: string;
  members: Coequipier[];
  categorie?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://137.74.133.131";

const getAuthHeaders = () => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" } as Record<string, string>;
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || localStorage.getItem("accessToken");
};

const resolveDocUrl = (docUrl?: string | null) => {
  if (!docUrl) return null;
  if (docUrl.startsWith("http://") || docUrl.startsWith("https://")) return docUrl;
  return `${API_BASE_URL}${docUrl.startsWith("/") ? "" : "/"}${docUrl}`;
};

const getUserIdFromToken = (): number | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const data = JSON.parse(json);
    const candidate = data.userId ?? data.id ?? data.sub;
    const n = Number(candidate);
    if (!Number.isNaN(n) && Number.isFinite(n)) return Math.trunc(n);
    return null;
  } catch {
    return null;
  }
};

const getUsernameFromToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const data = JSON.parse(json);
    return data.sub || data.username || null;
  } catch {
    return null;
  }
};

function getTypeEpreuveLabel(type: string): string {
  const labels: Record<string, string> = {
    INDIVIDUELLE: "Individuelle",
    COLLECTIVE: "Collective",
  };
  return labels[type] || type;
}

function getNiveauEpreuveLabel(niveau: string): string {
  const labels: Record<string, string> = {
    QUALIFICATION: "Qualification",
    QUART_DE_FINALE: "Quart de finale",
    DEMI_FINALE: "Demi-finale",
    FINALE: "Finale",
  };
  return labels[niveau] || niveau;
}

function getGenreEpreuveLabel(genre: string | undefined): string {
  if (!genre) return "";
  const labels: Record<string, string> = {
    FEMININ: "Féminin",
    MASCULIN: "Masculin",
    MIXTE: "Mixte",
  };
  return labels[genre] || genre;
}

export default function AthletePage() {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [messages, setMessages] = useState<CommissaireMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [epreuves, setEpreuves] = useState<AthleteEpreuve[]>([]);
  const [epreuvesLoading, setEpreuvesLoading] = useState(false);
  const [epreuvesError, setEpreuvesError] = useState<string | null>(null);

  const [equipe, setEquipe] = useState<Equipe | null>(null);
  const [equipeLoading, setEquipeLoading] = useState(false);
  const [equipeError, setEquipeError] = useState<string | null>(null);

  // États pour l'édition
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    pays: "",
    observation: "",
  });

  // États pour les documents
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<"certificatMedical" | "passport">("certificatMedical");
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // États pour la validation (commissaire)
  const [isCommissaireMode, setIsCommissaireMode] = useState(false);
  const [validationMotif, setValidationMotif] = useState("");
  const [newMessage, setNewMessage] = useState("");

  // États pour la liste des athlètes (commissaire)
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);

  // Charger l'athlète (mode athlète ou commissaire)
  const loadAthlete = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      let athleteData = null;
      let messagesData: CommissaireMessage[] = [];

      if (isCommissaireMode) {
        // Mode commissaire : GET /api/commissaire/athletes/{id}/info
        const response = await fetch(`${API_BASE_URL}/api/commissaire/athletes/${id}/info`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          let backendError = "";
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const errJson = await response.json();
            backendError = errJson?.message || JSON.stringify(errJson);
          } else {
            backendError = await response.text();
          }
          throw new Error(`Erreur lors du chargement de l'athlète (HTTP ${response.status}) : ${backendError}`);
        }
        const data = await response.json();
        // Le backend peut retourner directement l'athlète ou avec un wrapper
        athleteData = data.athlete ?? data;

        // Récupération des messages (endpoint GET manquant dans la collection Postman)
        // On peut tenter un GET /api/commissaire/athletes/{id}/messages s'il existe, sinon on garde vide
        try {
          const messagesResponse = await fetch(`${API_BASE_URL}/api/commissaire/athletes/${id}/messages`, {
            headers: getAuthHeaders(),
          });
          if (messagesResponse.ok) {
            const messagesJson = await messagesResponse.json();
            messagesData = Array.isArray(messagesJson) ? messagesJson : messagesJson.messages || [];
          }
        } catch {
          // Ignorer les erreurs de messages
        }
      } else {
        // Mode athlète : POST /api/athlete/{id}/info (pour obtenir ses infos)
        // Mais l'endpoint POST attend un corps, il ne renvoie pas les données. Il faudrait un endpoint GET.
        // La collection Postman ne montre pas de GET pour les infos de l'athlète connecté.
        // On va utiliser le même endpoint POST mais avec des données vides ? Pas idéal.
        // Alternative : utiliser GET /api/athlete/info ? Mais pas dans la collection.
        // Pour l'instant, on fait un appel POST avec l'id et on espère qu'il renvoie les données.
        // Sinon, on peut récupérer l'athlète via le mode commissaire (mais c'est moins propre).
        // On utilisera donc le même endpoint que le commissaire mais en passant l'id en paramètre.
        // Pour simplifier, on fait un GET /api/commissaire/athletes/{id}/info en mode athlète aussi
        // (c'est le même endpoint, seul le rôle du token détermine les droits).
        const response = await fetch(`${API_BASE_URL}/api/commissaire/athletes/${id}/info`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error(`Erreur lors du chargement de l'athlète (HTTP ${response.status})`);
        }
        const data = await response.json();
        athleteData = data.athlete ?? data;
      }

      if (athleteData) {
        setAthlete(athleteData);
        setEditForm({
          nom: athleteData.nom,
          prenom: athleteData.prenom,
          dateNaissance: athleteData.dateNaissance,
          pays: athleteData.pays,
          observation: athleteData.observation,
        });
      }
      setMessages(messagesData);
      await loadEpreuves(athleteData?.id || id);
      await loadEquipe(athleteData?.id || id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadEpreuves = async (id: number) => {
    try {
      setEpreuvesLoading(true);
      setEpreuvesError(null);

      // Endpoint hypothétique – à adapter selon le backend réel
      const response = await fetch(`${API_BASE_URL}/api/athletes/${id}/epreuves`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Erreur lors du chargement des épreuves");

      const data = await response.json();
      const list = Array.isArray(data) ? data : data.epreuves || [];
      setEpreuves(list);
    } catch (err) {
      setEpreuvesError(err instanceof Error ? err.message : "Erreur inconnue");
      setEpreuves([]);
    } finally {
      setEpreuvesLoading(false);
    }
  };

  const loadEquipe = async (id: number) => {
    try {
      setEquipeLoading(true);
      setEquipeError(null);

      const response = await fetch(`${API_BASE_URL}/api/athlete/${id}/equipe`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        setEquipe(null);
        setEquipeError(null);
        return;
      }
      const data = await response.json();
      const hasEquipe = data && data.id;
      setEquipe(hasEquipe ? data : null);
    } catch (err) {
      setEquipeError(null);
      setEquipe(null);
    } finally {
      setEquipeLoading(false);
    }
  };

  // Charger tous les athlètes (mode commissaire)
  const loadAllAthletes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/commissaire/athletes`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Erreur lors du chargement des athlètes");

      const data = await response.json();
      // Le backend peut retourner un array directement ou un objet avec athletes
      const athletes = Array.isArray(data) ? data : data.athletes || [];
      setAllAthletes(athletes);
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  useEffect(() => {
    const parseLocalUserId = (): number | null => {
      try {
        const raw = localStorage.getItem("user");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const candidate = parsed.id ?? parsed.userId ?? parsed.sub ?? parsed.spectatorId;
        const n = Number(candidate);
        if (!Number.isNaN(n) && Number.isFinite(n)) return Math.trunc(n);
        const s = String(candidate ?? "");
        const m = s.match(/(\d+)/);
        return m ? Number(m[1]) : null;
      } catch {
        return null;
      }
    };

    const loadForCurrentUser = async () => {
      let id: number | null = null;
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: getAuthHeaders(),
        });
        if (response.ok) {
          const data = await response.json();
          id = Number(data?.id);
        }
      } catch {
        id = null;
      }
      if (!id || Number.isNaN(id)) {
        id = getUserIdFromToken();
      }
      if (!id || Number.isNaN(id)) {
        id = parseLocalUserId();
      }
      if (!id) id = 1;
      loadAthlete(id);
    };

    loadForCurrentUser();
  }, []);

  // Mettre à jour les informations de l'athlète
  const handleUpdateInfo = async () => {
    if (!athlete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/athlete/${athlete.id}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          nom: editForm.nom,
          prenom: editForm.prenom,
          dateNaissance: editForm.dateNaissance,
          pays: editForm.pays,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");

      const data = await response.json();
      // L'endpoint peut retourner l'athlète mis à jour
      if (data.athlete) {
        setAthlete(data.athlete);
        setIsEditing(false);
        alert("Informations mises à jour avec succès!");
      } else {
        // Si pas de retour, on recharge
        await loadAthlete(athlete.id);
        setIsEditing(false);
      }
    } catch (err) {
      alert("Erreur lors de la mise à jour: " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  };

  // Uploader un document
  const handleUploadDocument = async () => {
    if (!athlete || !documentFile) return;

    try {
      setUploading(true);

      const token = getAuthToken();
      if (!token) throw new Error("Token manquant");

      const formData = new FormData();
      formData.append(documentType, documentFile);

      const response = await fetch(`${API_BASE_URL}/api/athlete/${athlete.id}/doc/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Erreur lors de l'upload");

      const data = await response.json();
      // Mettre à jour l'athlète avec les nouvelles URLs
      setAthlete((prev) =>
        prev
          ? {
              ...prev,
              docs: {
                ...prev.docs,
                [documentType === "certificatMedical" ? "certificatMedicalUrl" : "passportUrl"]: data.fileUrl,
              },
            }
          : prev
      );
      setDocumentFile(null);
      alert("Document uploadé avec succès!");
    } catch (err) {
      alert("Erreur lors de l'upload: " + (err instanceof Error ? err.message : "Erreur inconnue"));
    } finally {
      setUploading(false);
    }
  };

  // Ajouter une observation/remarque
  const handleAddObservation = async () => {
    if (!athlete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/athlete/${athlete.id}/remarque`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          observation: editForm.observation,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'ajout de la remarque");

      const data = await response.json();
      if (data.athlete) {
        setAthlete(data.athlete);
        alert("Observation ajoutée avec succès!");
      } else {
        await loadAthlete(athlete.id);
      }
    } catch (err) {
      alert("Erreur: " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  };

  // Valider ou refuser l'athlète (commissaire)
  const handleValidation = async (valide: boolean) => {
    if (!athlete && !selectedAthleteId) return;

    const targetId = selectedAthleteId || athlete?.id;
    if (!targetId) return;

    let motif = "";
    if (!valide) {
      motif = prompt("Motif de refus (ex: Passeport expiré, Certificat médical manquant):") || "";
      if (!motif) {
        alert("Un motif est requis pour le refus");
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/commissaire/athletes/${targetId}/validation`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          valide,
          message: motif, // ou "motifRefus" selon le backend
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la validation");

      const data = await response.json();
      if (data.success || data.athlete) {
        alert(data.message || "Validation effectuée avec succès");

        // Recharger les données
        if (selectedAthleteId) {
          loadAthlete(selectedAthleteId);
          loadAllAthletes();
        } else {
          loadAthlete(athlete!.id);
        }
        setValidationMotif("");
      }
    } catch (err) {
      alert("Erreur: " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  };

  // Envoyer un message (commissaire)
  const handleSendMessage = async () => {
    if (!athlete && !selectedAthleteId) return;

    const targetId = selectedAthleteId || athlete?.id;
    if (!targetId || !newMessage.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/commissaire/athletes/${targetId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({
          contenu: newMessage.trim(),
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de l'envoi du message");

      const data = await response.json();
      if (data.success) {
        alert("Message envoyé avec succès!");
        setNewMessage("");

        // Recharger les messages si l'endpoint GET existe
        try {
          const messagesResponse = await fetch(`${API_BASE_URL}/api/commissaire/athletes/${targetId}/messages`, {
            headers: getAuthHeaders(),
          });
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            setMessages(Array.isArray(messagesData) ? messagesData : messagesData.messages || []);
          }
        } catch {
          // Ignorer
        }
      }
    } catch (err) {
      alert("Erreur: " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  };

  // Télécharger un document
  const handleDownloadDocument = async (docUrl: string | null | undefined, type: string) => {
    const resolvedUrl = resolveDocUrl(docUrl);
    if (!resolvedUrl) {
      alert("Document non disponible");
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) throw new Error("Token manquant");

      const response = await fetch(resolvedUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition") || "";
      const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const fileName = fileNameMatch?.[1] || `${type}.pdf`;

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      alert("Erreur de téléchargement: " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  };

  // Charger un athlète spécifique (commissaire)
  const handleSelectAthlete = async (id: number) => {
    setSelectedAthleteId(id);
    await loadAthlete(id);
  };

  const getDateTime = (date: string, time: string) => {
    return new Date(`${date}T${time}`);
  };

  const hasOverlap = (current: AthleteEpreuve, list: AthleteEpreuve[]) => {
    if (!current.heureDebut || !current.heureFin) return false;
    const start = getDateTime(current.date, current.heureDebut).getTime();
    const end = getDateTime(current.date, current.heureFin).getTime();

    return list.some((other) => {
      if (other.id === current.id) return false;
      if (other.date !== current.date) return false;
      if (!other.heureDebut || !other.heureFin) return false;

      const otherStart = getDateTime(other.date, other.heureDebut).getTime();
      const otherEnd = getDateTime(other.date, other.heureFin).getTime();
      return start < otherEnd && end > otherStart;
    });
  };

  const sortedEpreuves = [...epreuves].sort((a, b) => {
    const aTime = getDateTime(a.date, a.heureDebut || "00:00").getTime();
    const bTime = getDateTime(b.date, b.heureDebut || "00:00").getTime();
    return aTime - bTime;
  });

  const epreuvesByDate = sortedEpreuves.reduce<Record<string, AthleteEpreuve[]>>((acc, epreuve) => {
    if (!acc[epreuve.date]) {
      acc[epreuve.date] = [];
    }
    acc[epreuve.date].push(epreuve);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement des données...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold mt-4">Erreur</h1>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Button onClick={() => loadAthlete(athlete?.id || 1)} className="mt-4">
              Réessayer
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Mode switch Athlète/Commissaire */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              {isCommissaireMode ? "Mode Commissaire" : "Espace Athlète"}
            </h1>
            <Button
              onClick={() => {
                setIsCommissaireMode(!isCommissaireMode);
                if (isCommissaireMode) {
                  setSelectedAthleteId(null);
                  loadAthlete(athlete?.id || 1);
                } else {
                  loadAllAthletes();
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
                    <CardDescription>{allAthletes.length} athlètes enregistrés</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {allAthletes.map((athlete) => (
                        <div
                          key={athlete.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedAthleteId === athlete.id
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => handleSelectAthlete(athlete.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-medium">
                                {athlete.prenom} {athlete.nom}
                              </div>
                              <div className="text-sm text-muted-foreground">{athlete.pays}</div>
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
                                {athlete.docs.certificatMedicalUrl ? "Document disponible" : "Non fourni"}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {athlete.docs.certificatMedicalUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownloadDocument(athlete.docs.certificatMedicalUrl, "certificat-medical")
                                  }
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
                                {athlete.docs.passportUrl ? "Document disponible" : "Non fourni"}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {athlete.docs.passportUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadDocument(athlete.docs.passportUrl, "passport")}
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
                              placeholder="Message à l'athlète (ex: Passeport expiré, certificat manquant...)"
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
                      <h1 className="text-3xl font-bold">
                        {athlete.prenom} {athlete.nom}
                      </h1>
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
                    <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
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
                                onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Prénom</label>
                              <Input
                                value={editForm.prenom}
                                onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Date de naissance</label>
                              <Input
                                type="date"
                                value={editForm.dateNaissance}
                                onChange={(e) => setEditForm({ ...editForm, dateNaissance: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Pays</label>
                              <Input
                                value={editForm.pays}
                                onChange={(e) => setEditForm({ ...editForm, pays: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Observation</label>
                            <Textarea
                              value={editForm.observation}
                              onChange={(e) => setEditForm({ ...editForm, observation: e.target.value })}
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
                              <div className="mt-1 p-3 bg-muted rounded-lg">{athlete.observation}</div>
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
                      <CardDescription>Téléchargez vos documents obligatoires</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Certificat Médical */}
                        <div className="space-y-4 p-4 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">Certificat Médical</h3>
                              <p className="text-sm text-muted-foreground">
                                {athlete.docs.certificatMedicalUrl ? "Document disponible" : "Document non fourni"}
                              </p>
                            </div>
                            <Badge variant={athlete.docs.certificatMedicalUrl ? "outline" : "destructive"}>
                              {athlete.docs.certificatMedicalUrl ? "Fourni" : "Manquant"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setDocumentType("certificatMedical");
                                  setDocumentFile(e.target.files[0]);
                                }
                              }}
                              className="hidden"
                              id="certificat-upload"
                            />
                            <label htmlFor="certificat-upload" className="flex-1">
                              <Button className="w-full" variant="outline" asChild>
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {athlete.docs.certificatMedicalUrl ? "Remplacer" : "Télécharger"}
                                </span>
                              </Button>
                            </label>
                            {athlete.docs.certificatMedicalUrl && (
                              <Button
                                onClick={() =>
                                  handleDownloadDocument(athlete.docs.certificatMedicalUrl, "certificat-medical")
                                }
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
                                {athlete.docs.passportUrl ? "Document disponible" : "Document non fourni"}
                              </p>
                            </div>
                            <Badge variant={athlete.docs.passportUrl ? "outline" : "destructive"}>
                              {athlete.docs.passportUrl ? "Fourni" : "Manquant"}
                            </Badge>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  setDocumentType("passport");
                                  setDocumentFile(e.target.files[0]);
                                }
                              }}
                              className="hidden"
                              id="passport-upload"
                            />
                            <label htmlFor="passport-upload" className="flex-1">
                              <Button className="w-full" variant="outline" asChild>
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {athlete.docs.passportUrl ? "Remplacer" : "Télécharger"}
                                </span>
                              </Button>
                            </label>
                            {athlete.docs.passportUrl && (
                              <Button
                                onClick={() => handleDownloadDocument(athlete.docs.passportUrl, "passport")}
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
                              <Button onClick={handleUploadDocument} disabled={uploading} className="flex-1">
                                {uploading
                                  ? "Upload en cours..."
                                  : `Uploader ${documentType === "certificatMedical" ? "certificat médical" : "passeport"}`}
                              </Button>
                              <Button onClick={() => setDocumentFile(null)} variant="outline">
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
                    <div className="flex items-center justify-between w-full">
                      <CardTitle className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5" />
                        <span>Mes épreuves</span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Link href="/athlete/mon-equipe">
                          <Button variant="ghost" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Mon équipe
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <CardDescription>Calendrier et détails des épreuves programmées</CardDescription>
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
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="relative border-l pl-6 space-y-4">
                              {items.map((epreuve) => {
                                const overlap = hasOverlap(epreuve, items);
                                return (
                                  <div key={epreuve.id} className="relative">
                                    <div className="absolute -left-[9px] top-3 h-4 w-4 rounded-full border-2 border-primary bg-background"></div>
                                    <div
                                      className={`rounded-lg border p-4 ${
                                        overlap ? "border-red-300 bg-red-50/50" : "bg-card"
                                      }`}
                                    >
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
                                              {typeof epreuve.lieu === "string"
                                                ? epreuve.lieu
                                                : epreuve.lieu?.nom || "Non spécifié"}
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <Badge variant="outline">{getTypeEpreuveLabel(epreuve.typeEpreuve)}</Badge>
                                            <Badge variant="secondary">
                                              {getNiveauEpreuveLabel(epreuve.niveauEpreuve)}
                                            </Badge>
                                            {epreuve.genreEpreuve && (
                                              <Badge variant="outline">{getGenreEpreuveLabel(epreuve.genreEpreuve)}</Badge>
                                            )}
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
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Mon équipe */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Mon équipe</span>
                    </CardTitle>
                    <CardDescription>Informations sur votre équipe et vos coéquipiers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {equipeLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="mt-3 text-sm text-muted-foreground">Chargement de l'équipe...</p>
                        </div>
                      </div>
                    ) : equipeError ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                        <p className="mt-3 text-sm text-muted-foreground">{equipeError}</p>
                        <Button onClick={() => loadEquipe(athlete.id)} className="mt-4">
                          Réessayer
                        </Button>
                      </div>
                    ) : !equipe ? (
                      <div className="text-center py-8">
                        <Badge variant="secondary" className="mb-4">
                          Épreuve individuelle
                        </Badge>
                        <Users className="h-10 w-10 text-muted-foreground mx-auto" />
                        <p className="mt-3 text-sm text-muted-foreground">
                          Vous participez à une épreuve individuelle
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Informations de l'équipe */}
                        <div className="p-4 bg-gradient-to-br from-primary/10 to-background border rounded-lg">
                          <h3 className="font-semibold text-lg mb-2">{equipe.nom}</h3>
                          {equipe.categorie && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{equipe.categorie}</Badge>
                            </div>
                          )}
                        </div>

                        {/* Liste des coéquipiers */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            Coéquipiers ({equipe.members?.length || 0})
                          </h4>
                          {equipe.members && equipe.members.length > 0 ? (
                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
                              {equipe.members
                                .filter((member) => {
                                  const currentUsername = getUsernameFromToken();
                                  if (member.id && athlete?.id && member.id === athlete.id) return false;
                                  if (
                                    currentUsername &&
                                    member.username &&
                                    member.username.toLowerCase() === currentUsername.toLowerCase()
                                  )
                                    return false;
                                  return true;
                                })
                                .map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary" />
                                      </div>
                                      <div>
                                        <p className="font-medium">
                                          {member.prenom} {member.nom}
                                        </p>
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

                {/* Messages du commissaire */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Messages du commissaire</span>
                      {messages.filter((m) => !m.lu).length > 0 && (
                        <Badge variant="default" className="ml-2">
                          {messages.filter((m) => !m.lu).length} nouveau(x)
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
                            className={`p-4 border rounded-lg ${!message.lu ? "bg-blue-50 border-blue-200" : ""}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium">{message.expediteur}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(message.date).toLocaleDateString("fr-FR")}
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
                        <p className="mt-4 text-muted-foreground">Aucun message pour le moment</p>
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
  );
}