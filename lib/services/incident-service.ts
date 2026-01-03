import type { Incident, Notification } from "@/lib/types"
import { http } from "./http"

export const incidentRepo = {
  async listIncidents(filters?: Partial<Incident>): Promise<Incident[]> {
    return http.get<Incident[]>("/incidents", filters)
  },
  async createIncident(payload: Incident): Promise<Incident> {
    return http.post<Incident>("/incidents", payload)
  },
  async getIncidentById(id: string): Promise<Incident | null> {
    return http.get<Incident>(`/incidents/${id}`).catch(() => null)
  },
  async updateIncident(id: string, payload: Partial<Incident>): Promise<Incident> {
    return http.patch<Incident>(`/incidents/${id}`, payload)
  },
  async deleteIncident(id: string): Promise<void> {
    await http.delete<void>(`/incidents/${id}`)
  },
  async listNotifications(filters?: Partial<Notification>): Promise<Notification[]> {
    return http.get<Notification[]>("/notifications", filters)
  },
  async createNotification(payload: Notification): Promise<Notification> {
    return http.post<Notification>("/notifications", payload)
  },
}
