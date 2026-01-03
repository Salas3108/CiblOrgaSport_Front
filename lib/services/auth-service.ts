import type { Admin, Spectateur, Volontaire, Commissaire, Athlete } from "@/lib/types"
import { http } from "./http"

type Role = "admin" | "spectateur" | "volontaire" | "commissaire" | "athlete"

export const authRepo = {
  async getUserByEmail(role: Role, email: string) {
    // Replace with real DAO per table via API
    return http.get<Admin | Spectateur | Volontaire | Commissaire | Athlete | null>(`/auth/${role}/by-email`, { email })
  },

  async uploadUserDocuments(formData: FormData): Promise<void> {
    // Multipart upload for documents
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "/api"}/auth/documents`, {
      method: "POST",
      body: formData,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  },

  async adminValidateAthlete(payload: { athleteId: string; valid: boolean; notes?: string }): Promise<void> {
    await http.post<void>("/admin/athletes/validate", payload)
  },

  async getUserByUsername(username: string): Promise<Admin | Spectateur | Volontaire | Commissaire | Athlete | null> {
    return http.get<Admin | Spectateur | Volontaire | Commissaire | Athlete | null>("/auth/by-username", { username })
  },

  async hello(): Promise<{ message: string }> {
    return http.get<{ message: string }>("/health")
  },

  async login(email: string, password: string): Promise<{ token: string }> {
    return http.post<{ token: string }>("/auth/login", { email, password })
  },

  async register(payload: Record<string, unknown>): Promise<{ id: string }> {
    return http.post<{ id: string }>("/auth/register", payload)
  },
}
