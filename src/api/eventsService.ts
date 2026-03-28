import { http } from './httpClient';
import { toast } from 'sonner';

const GATEWAY = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://137.74.133.131';

type ApiError = Error & { status?: number };

function defaultMessageForStatus(status: number): string {
  if (status === 400) return "Données invalides."
  if (status === 401) return "Session expirée, veuillez vous reconnecter."
  if (status === 403) return "Accès refusé. Vérifiez vos droits."
  if (status === 404) return "Ressource introuvable."
  if (status === 409) return "Conflit : opération impossible."
  if (status === 422) return "Données non traitables. Vérifiez les champs envoyés."
  if (status === 500) return "Erreur serveur. Réessayez plus tard."
  return "Une erreur est survenue."
}

// Helper function for API calls
async function fetchAPI(url: string, options?: RequestInit) {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers
    }
  });

  const text = await res.text();
  let data: any = null;
  try { data = JSON.parse(text) } catch { /* not JSON */ }

  if (!res.ok) {
    const backendMessage: string | undefined =
      typeof data?.message === 'string' ? data.message :
      typeof data?.error === 'string' && res.status !== 500 ? data.error :
      undefined

    if (res.status === 401) {
      toast.error("Session expirée, veuillez vous reconnecter", { duration: 3000 })
      setTimeout(() => { window.location.href = '/login' }, 1500)
    } else if (res.status === 409) {
      toast.warning(`Conflit : ${backendMessage ?? "opération impossible."}`, { duration: 5000 })
    } else {
      toast.error(backendMessage || defaultMessageForStatus(res.status), { duration: 5000 })
    }

    const error = new Error(backendMessage || defaultMessageForStatus(res.status)) as ApiError;
    error.status = res.status;
    throw error;
  }

  return data ?? (text || null);
}

const isNotFoundError = (error: unknown) => {
  const status = (error as ApiError | undefined)?.status;
  if (status === 404) return true;

  const message = String((error as { message?: string } | undefined)?.message || error || '').toLowerCase();
  return message.includes('404') || message.includes('not found');
};

const normalizeCompetition = (item: any) => {
  const dateDebut = item?.dateDebut ?? item?.startDate ?? item?.dateStart ?? item?.date;
  const dateFin = item?.dateFin ?? item?.endDate ?? item?.dateEnd ?? item?.date;

  return {
    ...item,
    id: item?.id ?? item?.idCompetition ?? item?.competitionId,
    name: item?.name ?? item?.nomCompetition ?? item?.nom,
    dateDebut,
    dateFin,
    date: item?.date ?? dateDebut,
    type: item?.type ?? item?.discipline ?? item?.paysHote ?? 'Competition',
    eventId: item?.eventId ?? item?.event_id ?? item?.event?.id ?? item?.idEvenement
  };
};

const normalizeCompetitionList = (payload: any) =>
  Array.isArray(payload)
    ? payload
        .map(normalizeCompetition)
        .filter((competition) => competition?.id !== undefined && competition?.id !== null)
    : [];

// ========== EVENTS ==========
export async function getEvents() {
  return fetchAPI(`${GATEWAY}/events`);
}

export async function getEventById(id: number) {
  return fetchAPI(`${GATEWAY}/events/${id}`);
}

export async function createEvent(event: any) {
  return fetchAPI(`${GATEWAY}/events`, {
    method: 'POST',
    body: JSON.stringify(event)
  });
}

export async function updateEvent(id: number, event: any) {
  return fetchAPI(`${GATEWAY}/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(event)
  });
}

export async function deleteEvent(id: number) {
  return fetchAPI(`${GATEWAY}/events/${id}`, {
    method: 'DELETE'
  });
}

// ========== COMPETITIONS ==========
export async function getCompetitions() {
  try {
    const data = await fetchAPI(`${GATEWAY}/competitions`);
    return normalizeCompetitionList(data);
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }

    const data = await fetchAPI(`${GATEWAY}/events`);
    return normalizeCompetitionList(data);
  }
}

export async function getCompetitionById(id: number) {
  try {
    const data = await fetchAPI(`${GATEWAY}/competitions/${id}`);
    return normalizeCompetition(data);
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error;
    }

    const data = await fetchAPI(`${GATEWAY}/events/${id}`);
    return normalizeCompetition(data);
  }
}

export async function createCompetition(competition: any) {
  return fetchAPI(`${GATEWAY}/competitions`, {
    method: 'POST',
    body: JSON.stringify(competition)
  });
}

export async function updateCompetition(id: number, competition: any) {
  return fetchAPI(`${GATEWAY}/competitions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(competition)
  });
}

export async function deleteCompetition(id: number) {
  return fetchAPI(`${GATEWAY}/competitions/${id}`, {
    method: 'DELETE'
  });
}

// ========== EPREUVES ==========
export async function getEpreuves() {
  return fetchAPI(`${GATEWAY}/epreuves`);
}

export async function getEpreuveById(id: number) {
  return fetchAPI(`${GATEWAY}/epreuves/${id}`);
}

export async function createEpreuve(epreuve: any) {
  return fetchAPI(`${GATEWAY}/epreuves`, {
    method: 'POST',
    body: JSON.stringify(epreuve)
  });
}

export async function updateEpreuve(id: number, epreuve: any) {
  return fetchAPI(`${GATEWAY}/epreuves/${id}`, {
    method: 'PUT',
    body: JSON.stringify(epreuve)
  });
}

export async function deleteEpreuve(id: number) {
  return fetchAPI(`${GATEWAY}/epreuves/${id}`, {
    method: 'DELETE'
  });
}

// ========== LIEUX ==========
export async function getLieux() {
  return fetchAPI(`${GATEWAY}/lieux`);
}

export async function getLieuById(id: number) {
  return fetchAPI(`${GATEWAY}/lieux/${id}`);
}

export async function createLieu(lieu: any) {
  return fetchAPI(`${GATEWAY}/lieux`, {
    method: 'POST',
    body: JSON.stringify(lieu)
  });
}

export async function updateLieu(id: number, lieu: any) {
  return fetchAPI(`${GATEWAY}/lieux/${id}`, {
    method: 'PUT',
    body: JSON.stringify(lieu)
  });
}

export async function deleteLieu(id: number) {
  return fetchAPI(`${GATEWAY}/lieux/${id}`, {
    method: 'DELETE'
  });
}

// ========== ADMIN ROUTES ==========
export async function adminGetEvents() {
  return fetchAPI(`${GATEWAY}/admin/events`);
}

export async function adminCreateEvent(event: any) {
  return fetchAPI(`${GATEWAY}/admin/events`, {
    method: 'POST',
    body: JSON.stringify(event)
  });
}

export async function adminDeleteEvent(id: number) {
  return fetchAPI(`${GATEWAY}/admin/events/${id}`, {
    method: 'DELETE'
  });
}

export async function adminAddCompetitionToEvent(eventId: number, competition: any) {
  return fetchAPI(`${GATEWAY}/admin/events/${eventId}/competitions`, {
    method: 'POST',
    body: JSON.stringify(competition)
  });
}

export async function adminAddEpreuveToCompetition(competitionId: number, epreuve: any) {
  return fetchAPI(`${GATEWAY}/admin/events/competitions/${competitionId}/epreuves`, {
    method: 'POST',
    body: JSON.stringify(epreuve)
  });
}

// ========== PARTICIPANT ASSIGNMENT ==========
export async function assignAthletesBulk(epreuveId: number, athleteIds: number[]) {
  return fetchAPI(`${GATEWAY}/epreuves/${epreuveId}/athletes/bulk`, {
    method: 'POST',
    body: JSON.stringify({ athleteIds })
  });
}

export async function assignAthleteToEpreuve(epreuveId: number, athleteId: number) {
  return fetchAPI(`${GATEWAY}/epreuves/${epreuveId}/athletes`, {
    method: 'POST',
    body: JSON.stringify({ athleteId })
  });
}

export async function assignEquipesToEpreuve(epreuveId: number, equipeIds: number[]) {
  return fetchAPI(`${GATEWAY}/epreuves/${epreuveId}/equipes`, {
    method: 'POST',
    body: JSON.stringify({ equipeIds })
  });
}

export async function getEpreuveAthletes(epreuveId: number) {
  return fetchAPI(`${GATEWAY}/epreuves/${epreuveId}/athletes`);
}

export async function getEpreuveEquipes(epreuveId: number) {
  return fetchAPI(`${GATEWAY}/epreuves/${epreuveId}/equipes`);
}

export async function getAthleteEpreuves(athleteId: number) {
  return fetchAPI(`${GATEWAY}/epreuves/athletes/${athleteId}`);
}

// ========== PARTICIPANTS-SERVICE ==========
export async function getAthletesValides() {
  return fetchAPI(`${GATEWAY}/commissaire/athletes/valides`);
}

export async function getAllAthletes() {
  return fetchAPI(`${GATEWAY}/commissaire/athletes`);
}

export async function getAthleteInfo(id: number) {
  return fetchAPI(`${GATEWAY}/commissaire/athletes/${id}/info`);
}

export async function validerAthlete(id: number, valide: boolean, motifRefus: string | null = null) {
  return fetchAPI(`${GATEWAY}/commissaire/athletes/${id}/validation`, {
    method: 'POST',
    body: JSON.stringify({ valide, message: valide ? 'Dossier validé' : motifRefus, motifRefus })
  });
}

export async function envoyerMessage(id: number, contenu: string) {
  return fetchAPI(`${GATEWAY}/commissaire/athletes/${id}/message`, {
    method: 'POST',
    body: JSON.stringify({ contenu })
  });
}

export async function getAllEquipes() {
  return fetchAPI(`${GATEWAY}/commissaire/equipes`);
}

export async function getEquipeById(id: number) {
  return fetchAPI(`${GATEWAY}/commissaire/equipes/${id}`);
}

export async function createEquipe(data: { nom: string; pays: string }) {
  return fetchAPI(`${GATEWAY}/commissaire/equipes`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateEquipe(id: number, data: { nom: string; pays: string }) {
  return fetchAPI(`${GATEWAY}/commissaire/equipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteEquipe(id: number) {
  return fetchAPI(`${GATEWAY}/commissaire/equipes/${id}`, { method: 'DELETE' });
}

export async function assignAthletesToEquipe(equipeId: number, athleteIds: number[]) {
  return fetchAPI(`${GATEWAY}/commissaire/equipes/${equipeId}/athletes`, {
    method: 'POST',
    body: JSON.stringify({ athleteIds })
  });
}

export async function getEpreuveAssignments() {
  return fetchAPI(`${GATEWAY}/commissaire/epreuves/assignments`);
}

// ========== PARTICIPATION STATUS & FORFAIT ==========

export async function getStatutParticipation(epreuveId: number, athleteId: number): Promise<{ epreuveId: number; athleteId: number; statut: "INSCRIT" | "EN_COURS" | "TERMINE" | "FORFAIT" }> {
  const res = await http.get(`${GATEWAY}/commissaire/epreuves/${epreuveId}/athletes/${athleteId}/statut`);
  return res.data;
}

export async function declarerForfait(epreuveId: number, athleteId: number, raison?: string): Promise<{ statutParticipation: string; dateForfait: string; message: string }> {
  const body = raison ? { detailsPerformance: { raison } } : {};
  const res = await http.post(`${GATEWAY}/epreuves/${epreuveId}/athletes/${athleteId}/forfait`, body);
  return res.data;
}

export default {
  getEvents, 
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getCompetitions,
  getCompetitionById,
  createCompetition,
  updateCompetition,
  deleteCompetition,
  getEpreuves,
  getEpreuveById,
  createEpreuve,
  updateEpreuve,
  deleteEpreuve,
  getLieux,
  getLieuById,
  createLieu,
  updateLieu,
  deleteLieu,
  adminGetEvents,
  adminCreateEvent,
  adminDeleteEvent,
  adminAddCompetitionToEvent,
  adminAddEpreuveToCompetition
};
