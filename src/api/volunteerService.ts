const GATEWAY = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

export type VolunteerProgramTask = {
  volunteerId: number
  volunteerName: string
  taskDate: string
  startTime: string
  endTime: string
  location: string
  role: string
}

export type VolunteerListItem = {
  id: number
  username: string
  email?: string
  validated?: boolean
  role?: string
}

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (typeof window === "undefined") return headers
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

export async function importVolunteerPrograms(tasks: VolunteerProgramTask[]) {
  const response = await fetch(`${GATEWAY}/api/v1/admin/programs/import`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(tasks),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors de l'import des programmes")
  }

  return response.json() as Promise<VolunteerProgramTask[]>
}

export async function getVolunteerTodayProgram(volunteerId: number, date?: string) {
  const url = new URL(`${GATEWAY}/api/v1/volunteers/${volunteerId}/today`)
  if (date) url.searchParams.set("date", date)

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors du chargement du programme")
  }

  return response.json() as Promise<VolunteerProgramTask[]>
}

export async function getVolunteers(validated?: boolean) {
  const url = new URL(`${GATEWAY}/auth/admin/volunteers`)
  if (validated !== undefined) {
    url.searchParams.set("validated", String(validated))
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors du chargement des volontaires")
  }

  return response.json() as Promise<VolunteerListItem[]>
}

export async function getAllVolunteerTasks() {
  const response = await fetch(`${GATEWAY}/api/v1/admin/programs/all`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors du chargement des tâches")
  }

  return response.json() as Promise<VolunteerProgramTask[]>
}
