const GATEWAY = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data?.message || text);
    return data;
  } catch (e) {
    if (!res.ok) throw new Error(text || `Erreur ${res.status}`);
    return text ? JSON.parse(text) : null;
  }
}

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
  return fetchAPI(`${GATEWAY}/competitions`);
}

export async function getCompetitionById(id: number) {
  return fetchAPI(`${GATEWAY}/competitions/${id}`);
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
