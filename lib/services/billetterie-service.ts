import type { Billet, Abonnement } from "@/lib/types"
import { http } from "./http"

export const billetterieRepo = {
  async listBillets(filters?: Partial<Billet>): Promise<Billet[]> {
    return http.get<Billet[]>("/billets", filters)
  },
  async createBillet(payload: Billet): Promise<Billet> {
    return http.post<Billet>("/billets", payload)
  },
  async getBilletById(id: string): Promise<Billet | null> {
    return http.get<Billet>(`/billets/${id}`).catch(() => null)
  },
  async updateBillet(id: string, payload: Partial<Billet>): Promise<Billet> {
    return http.patch<Billet>(`/billets/${id}`, payload)
  },
  async deleteBillet(id: string): Promise<void> {
    await http.delete<void>(`/billets/${id}`)
  },

  async listAbonnements(filters?: Partial<Abonnement>): Promise<Abonnement[]> {
    return http.get<Abonnement[]>("/abonnements", filters)
  },
  async upsertAbonnement(payload: Abonnement): Promise<Abonnement> {
    const id = (payload as unknown as { id?: string }).id
    return id
      ? http.patch<Abonnement>(`/abonnements/${id}`, payload)
      : http.post<Abonnement>("/abonnements", payload)
  },

  async getTicketPrice(query?: Record<string, string | number>): Promise<number> {
    const res = await http.get<{ price: number }>("/billets/price", query)
    return res.price
  },
}
