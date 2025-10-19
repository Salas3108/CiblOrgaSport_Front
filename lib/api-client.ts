// API client utilities for CiblOrgaSport

class ApiClient {
  private baseUrl = "/api"

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth API
  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  // Events API
  async getEvents(filters?: { type?: string; status?: string; venue?: string }) {
    const params = new URLSearchParams()
    if (filters?.type) params.append("type", filters.type)
    if (filters?.status) params.append("status", filters.status)
    if (filters?.venue) params.append("venue", filters.venue)

    const query = params.toString()
    return this.request(`/events${query ? `?${query}` : ""}`)
  }

  async createEvent(eventData: any) {
    return this.request("/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    })
  }

  // Results API
  async getResults(eventId: string) {
    return this.request(`/results?eventId=${eventId}`)
  }

  async createResult(resultData: any) {
    return this.request("/results", {
      method: "POST",
      body: JSON.stringify(resultData),
    })
  }

  // Incidents API
  async getIncidents(filters?: { status?: string; severity?: string }) {
    const params = new URLSearchParams()
    if (filters?.status) params.append("status", filters.status)
    if (filters?.severity) params.append("severity", filters.severity)

    const query = params.toString()
    return this.request(`/incidents${query ? `?${query}` : ""}`)
  }

  async createIncident(incidentData: any) {
    return this.request("/incidents", {
      method: "POST",
      body: JSON.stringify(incidentData),
    })
  }

  // Venues API
  async getVenues() {
    return this.request("/venues")
  }
}

export const apiClient = new ApiClient()
