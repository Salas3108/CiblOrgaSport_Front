// Database models and TypeScript interfaces for CiblOrgaSport

export interface User {
  id: string
  email: string
  password: string
  role: "athlete" | "official" | "spectator" | "volunteer" | "admin"
  firstName: string
  lastName: string
  nationality?: string
  accreditation?: string
  isTracked: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  name: string
  type: "competition" | "ceremony" | "training" | "other"
  sport: string
  discipline: string
  venue: string
  startTime: Date
  endTime: Date
  status: "scheduled" | "ongoing" | "completed" | "cancelled" | "postponed"
  maxParticipants?: number
  description?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Competition extends Event {
  category: "individual" | "relay" | "team"
  gender: "male" | "female" | "mixed"
  distance?: string
  style?: string
  round: "heats" | "semifinals" | "finals"
}

export interface Participant {
  id: string
  userId: string
  eventId: string
  lane?: number
  seedTime?: string
  status: "registered" | "confirmed" | "withdrawn" | "disqualified"
  registeredAt: Date
}

export interface Result {
  id: string
  eventId: string
  participantId: string
  time?: string
  score?: number
  position: number
  isRecord: boolean
  recordType?: "world" | "european" | "national" | "championship"
  validatedBy?: string
  validatedAt?: Date
  createdAt: Date
}

export interface Incident {
  id: string
  title: string
  description: string
  type: "security" | "medical" | "technical" | "weather" | "other"
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "in-progress" | "resolved" | "closed"
  location?: string
  eventId?: string
  affectedRoles: string[]
  reportedBy: string
  assignedTo?: string
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "result" | "security" | "event" | "system" | "personal"
  priority: "low" | "medium" | "high" | "urgent"
  isRead: boolean
  data?: any
  expiresAt?: Date
  createdAt: Date
}

export interface Venue {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  capacity: number
  facilities: string[]
  accessInfo: string
  emergencyContacts: string[]
}

export interface Schedule {
  id: string
  userId: string
  eventId: string
  role: string
  tasks: string[]
  startTime: Date
  endTime: Date
  location: string
  instructions?: string
  createdAt: Date
}

export type Admin = { idAdmin: string; nom: string; prénom: string; email: string; motDePasse: string; rapports?: string[] }
export type Spectateur = { idSpectateur: string; nom: string; prénom: string; email: string; motDePasse: string; role?: string; consentLocalisation?: boolean }
export type Volontaire = { idVolontaire: string; nom: string; prénom: string; email: string; motDePasse: string; accreditation?: string; affectation?: string; listeTaches?: string[] }
export type Commissaire = { idCommissaire: string; nom: string; prénom: string; email: string; motDePasse: string; accreditation?: string; zone_responsabilite?: string; type?: string }
export type Athlete = { idAthlete: string; nom: string; prénom: string; email: string; motDePasse: string; passeport?: string; certificatMedical?: string; statut?: string; geolocActive?: boolean; idCommissaire?: string }
export type Equipe = { idEquipe: string; nom_equipe: string; listeAthlete: string[] }

export type Evenement = { idEvenement: string; nomEvenement: string; dateDebut: string; dateFin: string; description?: string; lieuPrincipal?: string; idAdmin: string }
export type CompetitionFR = { idCompetition: string; nomCompetition: string; categorie?: string; dateDebut: string; dateFin: string; idEvenement: string; idCommissaire?: string }
export type Lieu = { idLieu: string; nomLieu: string; ville?: string; adresse?: string; typeLieu?: string; coordonneesGPS?: string }
export type Epreuve = { idEpreuve: string; nomEpreuve: string; horaireDebut: string; horaireFin: string; statut: string; typeEpreuve?: string; idLieu: string; idResultat?: string; idCompetition: string; idCommissaire?: string }

export type Resultat = { idResultat: string; medaille?: string; qualification?: string; classement?: number; idAthlete?: string; idEquipe?: string; idCommissaire: string }

export type Billet = { idBillet: string; type_billet: string; date_emission: string; QR_code: string; idSpectateur: string; idEpreuve: string }
export type Abonnement = { idSpectateur: string; idCompetition: string; date_abonnement: string; preference_notif?: string }

export type ProgrammeVolontaire = { idProgramme: string; date_prog: string; liste_taches: string[]; idEpreuve: string; idVolontaire: string; idAdmin: string }

export type EventFlux = { idEvent: string; date_event: string; type_event: string; description?: string; idEpreuve: string }
export type EventPrevu = { idEvent: string; type_event_detail?: string; heure_prevue?: string; statut: string }
export type IncidentFR = { idEvent: string; niveau_impact: string; description_detail?: string; date_incid: string; type_incident: string; idLieu: string; idCommissaire?: string }
export type NotificationFR = { id_notification: string; type: string; contenu: string; date_envoi: string; idEvent: string; idSpectateur?: string }
