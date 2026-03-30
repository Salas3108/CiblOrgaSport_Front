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
  Trophy,
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

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || localStorage.getItem("accessToken");
};

const resolveDocUrl = (docUrl?: string | null): string | null => {
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
      atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
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
      atob(base64).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    const data = JSON.parse(json);
    return data.sub || data.username || null;
  } catch {
    return null;
  }
};

export default function AthletePage() {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [messages, setMessages] = useState<CommissaireMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [equipe, setEquipe] = useState<Equipe | null>(null);
  const [equipeLoading, setEquipeLoading] = useState(false);
  const [equipeError, setEquipeError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    pays: "",
    observation: "",
  });

  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<"certificatMedical" | "passport">("certificatMedical");
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // ── Chargement athlète via /api/athlete/{id}/info ───────────────────────────
  const loadAthlete = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/athlete/${id}/info`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(`Erreur lors du chargement (HTTP ${response.status})`);
      const data = await response.json();
      const athleteData = data.athlete ?? data;
      setAthlete(athleteData);
      setEditForm({
        nom: athleteData.nom ?? "",
        prenom: athleteData.prenom ?? "",
        dateNaissance: athleteData.dateNaissance ?? "",
        pays: athleteData.pays ?? "",
        observation: athleteData.observation ?? "",
      });
      await loadEquipe(athleteData.id ?? id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // ── Équipe via /api/athlete/{id}/equipe ─────────────────────────────────────
  const loadEquipe = async (id: number) => {
    try {
      setEquipeLoading(true);
      setEquipeError(null);
      const response = await fetch(`${API_BASE_URL}/api/athlete/${id}/equipe`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) { setEquipe(null); return; }
      const data = await response.json();
      setEquipe(data?.id ? data : null);
    } catch {
      setEquipe(null);
    } finally {
      setEquipeLoading(false);
    }
  };

  // ── Init : résoudre l'ID depuis le token ────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      let id: number | null = null;
      try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: getAuthHeaders() });
        if (res.ok) { const d = await res.json(); id = Number(d?.id) || null; }
      } catch { /* ignore */ }
      if (!id) id = getUserIdFromToken();
      if (!id) {
        try {
          const raw = localStorage.getItem("user");
          if (raw) { const p = JSON.parse(raw); id = Number(p.id ?? p.userId) || null; }
        } catch { /* ignore */ }
      }
      if (!id) { setError("Impossible de récupérer votre identifiant. Veuillez vous reconnecter."); setLoading(false); return; }
      loadAthlete(id);
    };
    init();
  }, []);

  // ── Mettre à jour les infos : POST /api/athlete/{id}/info ──────────────────
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
      setAthlete(data.athlete ?? { ...athlete, ...editForm });
      setIsEditing(false);
    } catch (err) {
      alert("Erreur : " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  };

  // ── Ajouter une remarque : POST /api/athlete/{id}/remarque ─────────────────
  const handleAddObservation = async () => {
    if (!athlete) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/athlete/${athlete.id}/remarque`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuthToken()}` },
        body: JSON.stringify({ observation: editForm.observation }),
      });
      if (!response.ok) throw new Error("Erreur lors de l'ajout de la remarque");
      const data = await response.json();
      if (data.athlete) setAthlete(data.athlete);
      else await loadAthlete(athlete.id);
    } catch (err) {
      alert("Erreur : " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  };

  // ── Upload document : POST /api/athlete/{id}/doc/upload ────────────────────
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
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error("Erreur lors de l'upload");
      const data = await response.json();
      setAthlete((prev) => prev ? {
        ...prev,
        docs: {
          ...prev.docs,
          [documentType === "certificatMedical" ? "certificatMedicalUrl" : "passportUrl"]: data.fileUrl,
        },
      } : prev);
      setDocumentFile(null);
      alert("Document uploadé avec succès !");
    } catch (err) {
      alert("Erreur upload : " + (err instanceof Error ? err.message : "Erreur inconnue"));
    } finally {
      setUploading(false);
    }
  };

  // ── Télécharger un document : GET /api/athlete/{id}/doc/{docType} ──────────
  const handleDownloadDocument = async (docUrl: string | null | undefined, type: string) => {
    if (!athlete) return;
    const docType = type === "certificat-medical" ? "certificatMedical" : "passport";
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Token manquant");
      const response = await fetch(`${API_BASE_URL}/api/athlete/${athlete.id}/doc/${docType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      const blob = await response.blob();
      const contentDisposition = response.headers.get("Content-Disposition") || "";
      const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const fileName = fileNameMatch?.[1] || `${docType}.pdf`;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      alert("Erreur téléchargement : " + (err instanceof Error ? err.message : "Erreur inconnue"));
    }
  };

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
            {athlete && (
              <Button onClick={() => loadAthlete(athlete.id)} className="mt-4">Réessayer</Button>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (!athlete) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">

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
                      <><CheckCircle className="h-3 w-3 mr-1" />Validé</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" />En attente de validation</>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
            <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
              {isEditing ? <><X className="h-4 w-4 mr-2" />Annuler</> : <><Edit className="h-4 w-4 mr-2" />Modifier</>}
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Informations personnelles */}
            <Card>
              <CardHeader><CardTitle>Informations personnelles</CardTitle></CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Nom</label>
                        <Input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Prénom</label>
                        <Input value={editForm.prenom} onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date de naissance</label>
                        <Input type="date" value={editForm.dateNaissance} onChange={(e) => setEditForm({ ...editForm, dateNaissance: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Pays</label>
                        <Input value={editForm.pays} onChange={(e) => setEditForm({ ...editForm, pays: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Observation</label>
                      <Textarea value={editForm.observation} onChange={(e) => setEditForm({ ...editForm, observation: e.target.value })} rows={3} placeholder="Ajoutez une observation..." />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleUpdateInfo} className="flex-1"><Save className="h-4 w-4 mr-2" />Enregistrer</Button>
                      <Button onClick={handleAddObservation} variant="outline" className="flex-1">Ajouter observation</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-sm text-muted-foreground">Nom</label><div className="font-medium">{athlete.nom}</div></div>
                      <div><label className="text-sm text-muted-foreground">Prénom</label><div className="font-medium">{athlete.prenom}</div></div>
                      <div><label className="text-sm text-muted-foreground">Date de naissance</label><div className="font-medium">{athlete.dateNaissance}</div></div>
                      <div><label className="text-sm text-muted-foreground">Pays</label><div className="font-medium">{athlete.pays}</div></div>
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
                  {/* Certificat médical */}
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
                      <input type="file" accept=".pdf" onChange={(e) => { if (e.target.files?.[0]) { setDocumentType("certificatMedical"); setDocumentFile(e.target.files[0]); } }} className="hidden" id="certificat-upload" />
                      <label htmlFor="certificat-upload" className="flex-1">
                        <Button className="w-full" variant="outline" asChild>
                          <span><Upload className="h-4 w-4 mr-2" />{athlete.docs.certificatMedicalUrl ? "Remplacer" : "Télécharger"}</span>
                        </Button>
                      </label>
                      {athlete.docs.certificatMedicalUrl && (
                        <Button onClick={() => handleDownloadDocument(athlete.docs.certificatMedicalUrl, "certificat-medical")} variant="outline" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />Télécharger
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
                      <input type="file" accept=".pdf" onChange={(e) => { if (e.target.files?.[0]) { setDocumentType("passport"); setDocumentFile(e.target.files[0]); } }} className="hidden" id="passport-upload" />
                      <label htmlFor="passport-upload" className="flex-1">
                        <Button className="w-full" variant="outline" asChild>
                          <span><Upload className="h-4 w-4 mr-2" />{athlete.docs.passportUrl ? "Remplacer" : "Télécharger"}</span>
                        </Button>
                      </label>
                      {athlete.docs.passportUrl && (
                        <Button onClick={() => handleDownloadDocument(athlete.docs.passportUrl, "passport")} variant="outline" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />Télécharger
                        </Button>
                      )}
                    </div>
                  </div>

                  {documentFile && (
                    <div className="p-4 bg-primary/10 border border-primary rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">{documentFile.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{(documentFile.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUploadDocument} disabled={uploading} className="flex-1">
                          {uploading ? "Upload en cours..." : `Uploader ${documentType === "certificatMedical" ? "certificat médical" : "passeport"}`}
                        </Button>
                        <Button onClick={() => setDocumentFile(null)} variant="outline">Annuler</Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : equipeError ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
                  <p className="mt-3 text-sm text-muted-foreground">{equipeError}</p>
                  <Button onClick={() => loadEquipe(athlete.id)} className="mt-4">Réessayer</Button>
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
                    {equipe.categorie && <Badge variant="outline">{equipe.categorie}</Badge>}
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Coéquipiers ({equipe.members?.length || 0})
                    </h4>
                    {equipe.members && equipe.members.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {equipe.members
                          .filter((member) => {
                            const currentUsername = getUsernameFromToken();
                            if (member.id && athlete.id && member.id === athlete.id) return false;
                            if (currentUsername && member.username && member.username.toLowerCase() === currentUsername.toLowerCase()) return false;
                            return true;
                          })
                          .map((member) => (
                            <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{member.prenom} {member.nom}</p>
                                  {member.username && <p className="text-xs text-muted-foreground">{member.username}</p>}
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
                  <Badge variant="default" className="ml-2">{messages.filter((m) => !m.lu).length} nouveau(x)</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`p-4 border rounded-lg ${!message.lu ? "bg-blue-50 border-blue-200" : ""}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{message.expediteur}</div>
                          <div className="text-sm text-muted-foreground">{new Date(message.date).toLocaleDateString("fr-FR")}</div>
                        </div>
                        {!message.lu && <Badge variant="outline" className="bg-blue-100 text-blue-800">Nouveau</Badge>}
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
      </main>
    </div>
  );
}
