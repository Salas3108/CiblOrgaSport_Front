import type { Evenement, Competition, Lieu, Epreuve, Resultat, EventFlux, EventPrevu } from "@/lib/types"
import { http } from "./http"

export const eventRepo = {
  // LIEU
  async listLieux(filters?: Partial<Lieu>): Promise<Lieu[]> {
    return http.get<Lieu[]>("/lieux", filters)
  },
  async createLieu(payload: Lieu): Promise<Lieu> {
    return http.post<Lieu>("/lieux", payload)
  },
  async getLieuById(id: string): Promise<Lieu | null> {
    return http.get<Lieu>(`/lieux/${id}`).catch(() => null)
  },
  async updateLieu(id: string, payload: Partial<Lieu>): Promise<Lieu> {
    return http.patch<Lieu>(`/lieux/${id}`, payload)
  },
  async deleteLieu(id: string): Promise<void> {
    await http.delete<void>(`/lieux/${id}`)
  },

  // EVENEMENT / COMPETITION / EPREUVE
  async listEvenements(filters?: Partial<Evenement>): Promise<Evenement[]> {
    return http.get<Evenement[]>("/evenements", filters)
  },
  async createEvenement(payload: Evenement): Promise<Evenement> {
    return http.post<Evenement>("/evenements", payload)
  },
  async getEvenementById(id: string): Promise<Evenement | null> {
    return http.get<Evenement>(`/evenements/${id}`).catch(() => null)
  },
  async updateEvenement(id: string, payload: Partial<Evenement>): Promise<Evenement> {
    return http.patch<Evenement>(`/evenements/${id}`, payload)
  },
  async deleteEvenement(id: string): Promise<void> {
    await http.delete<void>(`/evenements/${id}`)
  },

  async listCompetitions(filters?: Partial<Competition>): Promise<Competition[]> {
    return http.get<Competition[]>("/competitions", filters)
  },
  async createCompetition(payload: Competition): Promise<Competition> {
    return http.post<Competition>("/competitions", payload)
  },
  async getCompetitionById(id: string): Promise<Competition | null> {
    return http.get<Competition>(`/competitions/${id}`).catch(() => null)
  },
  async updateCompetition(id: string, payload: Partial<Competition>): Promise<Competition> {
    return http.patch<Competition>(`/competitions/${id}`, payload)
  },
  async deleteCompetition(id: string): Promise<void> {
    await http.delete<void>(`/competitions/${id}`)
  },

  async listEpreuves(filters?: Partial<Epreuve>): Promise<Epreuve[]> {
    return http.get<Epreuve[]>("/epreuves", filters)
  },
  async createEpreuve(payload: Epreuve): Promise<Epreuve> {
    return http.post<Epreuve>("/epreuves", payload)
  },
  async getEpreuveById(id: string): Promise<Epreuve | null> {
    return http.get<Epreuve>(`/epreuves/${id}`).catch(() => null)
  },
  async updateEpreuve(id: string, payload: Partial<Epreuve>): Promise<Epreuve> {
    return http.patch<Epreuve>(`/epreuves/${id}`, payload)
  },
  async deleteEpreuve(id: string): Promise<void> {
    await http.delete<void>(`/epreuves/${id}`)
  },

  // RESULTATS
  async listResultats(filters?: Partial<Resultat>): Promise<Resultat[]> {
    return http.get<Resultat[]>("/resultats", filters)
  },
  async createResultat(payload: Resultat): Promise<Resultat> {
    return http.post<Resultat>("/resultats", payload)
  },

  // Flux d'événements
  async listEventFlux(filters?: Partial<EventFlux>): Promise<EventFlux[]> {
    return http.get<EventFlux[]>("/event-flux", filters)
  },
  async upsertEventPrevu(payload: EventPrevu): Promise<EventPrevu> {
    // If payload has id, PATCH, else POST
    const id = (payload as unknown as { id?: string }).id
    return id
      ? http.patch<EventPrevu>(`/event-prevus/${id}`, payload)
      : http.post<EventPrevu>("/event-prevus", payload)
  },

  // Admin-only routes
  async adminListEvents(filters?: Partial<Evenement>): Promise<Evenement[]> {
    return http.get<Evenement[]>("/admin/evenements", filters)
  },
  async adminCreateEvent(payload: Evenement): Promise<Evenement> {
    return http.post<Evenement>("/admin/evenements", payload)
  },
  async adminDeleteEvent(id: string): Promise<void> {
    await http.delete<void>(`/admin/evenements/${id}`)
  },
  async adminCreateCompetition(eventId: string, payload: Competition): Promise<Competition> {
    return http.post<Competition>(`/admin/evenements/${eventId}/competitions`, payload)
  },
  async adminCreateEpreuve(competitionId: string, payload: Epreuve): Promise<Epreuve> {
    return http.post<Epreuve>(`/admin/competitions/${competitionId}/epreuves`, payload)
  },
}
