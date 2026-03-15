const GATEWAY = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

type ApiError = Error & { status?: number };

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
    if (!res.ok) {
      const error = new Error(data?.message || text || `Erreur ${res.status}`) as ApiError;
      error.status = res.status;
      throw error;
    }
    return data;
  } catch (e) {
    if (!res.ok) {
      const error = new Error(text || `Erreur ${res.status}`) as ApiError;
      error.status = res.status;
      throw error;
    }
    return text ? JSON.parse(text) : null;
  }
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
