const GATEWAY = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"
const VOLUNTEER_ADMIN_API =
  process.env.NEXT_PUBLIC_VOLUNTEER_ADMIN_API || `${GATEWAY}/api/v1/admin/volunteers`

// Volunteer Profile Types
export type VolunteerProfile = {
  id: string // UUID
  email: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  languages?: string[]
  preferredTaskTypes?: string[]
  availabilities?: AvailabilityDTO[]
  profileComplete: boolean
}

export type AvailabilityDTO = {
  dayOfWeek: string
  startTime: string
  endTime: string
}

export type VolunteerProfileComplete = {
  firstName: string
  lastName: string
  phoneNumber?: string
  languages?: string[]
  availabilities?: AvailabilityDTO[]
  preferredTaskTypes?: string[]
}

// Volunteer Task Types
export type VolunteerTask = {
  id: string
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  location: string
  taskType?: VolunteerTaskDTO["taskType"]
  volunteersNeeded?: number
  eventId?: string
  requiredSkills?: string[]
  requiredLanguages?: string[]
  assignedTo?: string
  assignedCount?: number
  status: "pending" | "assigned" | "completed" | "cancelled"
}

// Backend DTO for creating tasks
export type VolunteerTaskDTO = {
  title: string
  description?: string
  taskDate: string // YYYY-MM-DD
  startTime: string // HH:mm:ss
  endTime: string // HH:mm:ss
  location: string
  taskType: "ACCUEIL" | "ORIENTATION" | "SUPPORT_LOGISTIQUE" | "SECURITE" | "PREMIERS_SECOURS" | "ACCOMPAGNEMENT_ATHLETES" | "DISTRIBUTION_EAU" | "NETTOYAGE" | "BILLETTERIE" | "INFORMATION" | "AUTRE"
  volunteersNeeded: number
  requiredLanguages?: string[]
  eventId: string // UUID
}

export type VolunteerListItem = {
  id: string
  username?: string
  email?: string
  firstName?: string
  lastName?: string
  validated?: boolean
  profileComplete?: boolean
  availabilities?: AvailabilityDTO[]
  languages?: string[]
}

export type VolunteerMatchInfo = {
  volunteer: VolunteerListItem
  isMatch: boolean
  missingRequirements: string[]
}

type BackendVolunteerTask = {
  id?: string
  title?: string
  description?: string
  date?: string
  taskDate?: string
  startTime?: string
  endTime?: string
  location?: string
  taskType?: VolunteerTaskDTO["taskType"]
  volunteersNeeded?: number
  eventId?: string
  requiredLanguages?: string[] | string
  requiredLanguagesSet?: string[]
  requiredSkills?: string[]
  assignedTo?: string
  assignedCount?: number
  assignedVolunteerIds?: string[] | string
  assignedVolunteerIdsSet?: string[]
  assignedVolunteers?: Array<{ id?: string }>
  fullyStaffed?: boolean
  status?: VolunteerTask["status"]
}

function parseCsvOrArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0)
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
  }

  return []
}

function parseAssignedVolunteerIds(task: BackendVolunteerTask): string[] {
  const fromSet = parseCsvOrArray(task.assignedVolunteerIdsSet)
  if (fromSet.length > 0) return fromSet

  const fromCsv = parseCsvOrArray(task.assignedVolunteerIds)
  if (fromCsv.length > 0) return fromCsv

  const fromLegacyList = (task.assignedVolunteers || [])
    .map((v) => (v?.id ? String(v.id) : ""))
    .filter((id) => id.length > 0)
  if (fromLegacyList.length > 0) return fromLegacyList

  return task.assignedTo ? [String(task.assignedTo)] : []
}

function normalizeVolunteerListItem(raw: VolunteerListItem & { languages?: unknown }): VolunteerListItem {
  return {
    ...raw,
    languages: parseCsvOrArray(raw?.languages),
  }
}

function normalizeVolunteerProfile(raw: VolunteerProfile): VolunteerProfile {
  return {
    ...raw,
    languages: parseCsvOrArray(raw?.languages),
    preferredTaskTypes: parseCsvOrArray(raw?.preferredTaskTypes),
    availabilities: raw?.availabilities || [],
  }
}

function normalizeTask(task: BackendVolunteerTask): VolunteerTask {
  const assignedIds = parseAssignedVolunteerIds(task)
  const assignedTo = assignedIds[0]
  const assignedCount = Number(task.assignedCount ?? assignedIds.length)
  const derivedStatus: VolunteerTask["status"] = assignedCount > 0 ? "assigned" : "pending"
  const requiredLanguages = parseCsvOrArray(task.requiredLanguagesSet ?? task.requiredLanguages)

  return {
    id: String(task.id ?? ""),
    title: task.title ?? "",
    description: task.description ?? "",
    date: task.date ?? task.taskDate ?? "",
    startTime: task.startTime ?? "",
    endTime: task.endTime ?? "",
    location: task.location ?? "",
    taskType: task.taskType,
    volunteersNeeded: task.volunteersNeeded,
    eventId: task.eventId,
    requiredLanguages,
    requiredSkills: task.requiredSkills ?? [],
    assignedTo,
    assignedCount,
    status: task.status ?? derivedStatus,
  }
}

function normalizeTaskList(tasks: BackendVolunteerTask[]): VolunteerTask[] {
  return (tasks ?? []).map(normalizeTask)
}

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (typeof window === "undefined") return headers
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken")
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

// ===== VOLUNTEER PROFILE ENDPOINTS =====

export async function completeVolunteerProfile(data: VolunteerProfileComplete) {
  const response = await fetch(`${GATEWAY}/api/v1/volunteers/profile/complete`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors de la complétude du profil")
  }

  const profile = (await response.json()) as VolunteerProfile
  return normalizeVolunteerProfile(profile)
}

export async function getVolunteerProfile() {
  const response = await fetch(`${GATEWAY}/api/v1/volunteers/profile`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors de la récupération du profil")
  }

  const profile = (await response.json()) as VolunteerProfile
  return normalizeVolunteerProfile(profile)
}

// ===== VOLUNTEER SCHEDULE ENDPOINTS =====

export async function getVolunteerScheduleToday() {
  const response = await fetch(`${GATEWAY}/api/v1/volunteers/schedule/today`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  // 404 is expected for new volunteers without assigned tasks
  if (response.status === 404) {
    return []
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors du chargement du planning du jour")
  }

  const tasks = (await response.json()) as BackendVolunteerTask[]
  return normalizeTaskList(tasks)
}

export async function getVolunteerSchedule(date: string) {
  const url = new URL(`${GATEWAY}/api/v1/volunteers/schedule`)
  url.searchParams.set("date", date)

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
  })

  // Compatibilite avec les versions backend/gateway qui n'exposent pas encore /schedule
  if (response.status === 404) {
    return getVolunteerScheduleToday()
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors du chargement du planning")
  }

  const tasks = (await response.json()) as BackendVolunteerTask[]
  return normalizeTaskList(tasks)
}

// ===== ADMIN VOLUNTEER LIST ENDPOINTS =====

export async function getVolunteers(validated?: boolean) {
  const url = new URL(`${VOLUNTEER_ADMIN_API}`, window.location.origin)
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

  const volunteers = (await response.json()) as VolunteerListItem[]
  return (volunteers || []).map(normalizeVolunteerListItem)
}

export async function getVolunteer(id: number) {
  const response = await fetch(`${VOLUNTEER_ADMIN_API}/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors de la récupération du volontaire")
  }

  const volunteer = (await response.json()) as VolunteerListItem
  return normalizeVolunteerListItem(volunteer)
}

// ===== ADMIN VOLUNTEER TASKS ENDPOINTS =====

export async function createVolunteerTask(task: VolunteerTaskDTO) {
  const response = await fetch(`${VOLUNTEER_ADMIN_API}/tasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(task),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors de la création de la tâche")
  }

  const created = (await response.json()) as BackendVolunteerTask
  return normalizeTask(created)
}

export async function importVolunteerTasks(tasks: any[], eventId?: number) {
  const url = new URL(`${VOLUNTEER_ADMIN_API}/tasks/import`, window.location.origin)
  if (eventId) url.searchParams.set("eventId", String(eventId))

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(tasks),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors de l'import des tâches")
  }

  const imported = (await response.json()) as BackendVolunteerTask[]
  return normalizeTaskList(imported)
}

export async function getAllVolunteerTasks() {
  const response = await fetch(`${VOLUNTEER_ADMIN_API}/tasks`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors du chargement des tâches")
  }

  const tasks = (await response.json()) as BackendVolunteerTask[]
  return normalizeTaskList(tasks)
}

export async function getVolunteerTasksByDate(date: string) {
  const url = new URL(`${VOLUNTEER_ADMIN_API}/tasks`, window.location.origin)
  url.searchParams.set("date", date)

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors du chargement des tâches")
  }

  const tasks = (await response.json()) as BackendVolunteerTask[]
  return normalizeTaskList(tasks)
}

export async function updateVolunteerTask(id: string, task: Partial<VolunteerTask> & Partial<VolunteerTaskDTO>) {
  // Transform frontend VolunteerTask format to backend VolunteerTaskDTO format
  const taskData: any = {
    title: task.title,
    description: task.description || "",
    taskDate: task.date || (task as any).taskDate, // Convert date -> taskDate for backend
    startTime: (task.startTime || "").includes(":") ? task.startTime : `${task.startTime}:00`,
    endTime: (task.endTime || "").includes(":") ? task.endTime : `${task.endTime}:00`,
    location: task.location,
    taskType: (task as any).taskType || "ACCUEIL",
    volunteersNeeded: (task as any).volunteersNeeded || 1,
    eventId: (task as any).eventId || "00000000-0000-0000-0000-000000000000",
    meetingPoint: (task as any).meetingPoint || "",
    equipment: (task as any).equipment || "",
    instructions: (task as any).instructions || "",
    requiresTraining: (task as any).requiresTraining || false,
    requiredLanguages: task.requiredLanguages || [],
    requiredSkills: (task as any).requiredSkills || [],
  }

  // Ensure time format is HH:mm:ss (add :00 if only HH:mm)
  if (taskData.startTime.split(":").length === 2) {
    taskData.startTime += ":00"
  }
  if (taskData.endTime.split(":").length === 2) {
    taskData.endTime += ":00"
  }

  const response = await fetch(`${VOLUNTEER_ADMIN_API}/tasks/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors de la mise à jour de la tâche")
  }

  const updated = (await response.json()) as BackendVolunteerTask
  return normalizeTask(updated)
}

export async function deleteVolunteerTask(id: string) {
  const tryDelete = async () => {
    return fetch(`${VOLUNTEER_ADMIN_API}/tasks/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
  }

  let response = await tryDelete()

  // Compatibilite: certains backends renvoient 409 si des volontaires sont assignes.
  // On desassigne automatiquement puis on retente la suppression.
  if (response.status === 409) {
    const tasksResponse = await fetch(`${VOLUNTEER_ADMIN_API}/tasks`, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (tasksResponse.ok) {
      const tasks = (await tasksResponse.json()) as BackendVolunteerTask[]
      const task = tasks.find((t) => String(t.id) === String(id))
      const assignedIds = task ? parseAssignedVolunteerIds(task) : []

      for (const volunteerId of assignedIds) {
        if (!volunteerId) continue

        await fetch(`${VOLUNTEER_ADMIN_API}/tasks/${id}/assign/${volunteerId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        })
      }

      response = await tryDelete()
    }
  }

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors de la suppression de la tâche")
  }
}

// ===== TASK ASSIGNMENT ENDPOINTS =====

export async function findSuitableVolunteers(taskId: string) {
  const response = await fetch(`${VOLUNTEER_ADMIN_API}/tasks/${taskId}/suitable-volunteers`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors de la récupération des volontaires adaptés")
  }

  const volunteers = (await response.json()) as VolunteerListItem[]
  return (volunteers || []).map(normalizeVolunteerListItem)
}

export async function findVolunteersWithMatchInfo(taskId: string) {
  const response = await fetch(`${VOLUNTEER_ADMIN_API}/tasks/${taskId}/volunteers-match-info`, {
    method: "GET",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors de la récupération des informations de correspondance")
  }

  const data = (await response.json()) as Array<VolunteerMatchInfo & { match?: boolean }>
  return (data || []).map((item) => ({
    volunteer: normalizeVolunteerListItem(item.volunteer),
    isMatch: typeof item.isMatch === "boolean" ? item.isMatch : Boolean(item.match),
    missingRequirements: item.missingRequirements || [],
  }))
}

export async function assignVolunteerToTask(taskId: string, volunteerId: string) {
  const response = await fetch(`${VOLUNTEER_ADMIN_API}/tasks/${taskId}/assign/${volunteerId}`, {
    method: "POST",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || ""
    let message = ""

    try {
      if (contentType.includes("application/json")) {
        const data = await response.json()
        message = data?.message || data?.detail || data?.error || ""
      } else {
        message = await response.text()
      }
    } catch {
      message = ""
    }

    if (response.status === 409) {
      throw new Error(
        message ||
          "Ce volontaire ne peut pas etre assigne a cette tache (conflit de planning, deja assigne, ou tache complete)."
      )
    }

    throw new Error(message || "Erreur lors de l'assignation du volontaire")
  }

  const updated = (await response.json()) as BackendVolunteerTask
  return normalizeTask(updated)
}

export async function autoAssignVolunteerToTask(taskId: string) {
  const response = await fetch(`${VOLUNTEER_ADMIN_API}/tasks/${taskId}/auto-assign`, {
    method: "POST",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors de l'assignation automatique")
  }

  const updated = (await response.json()) as BackendVolunteerTask
  return normalizeTask(updated)
}

export async function unassignVolunteerFromTask(taskId: string, volunteerId: string) {
  const response = await fetch(`${VOLUNTEER_ADMIN_API}/tasks/${taskId}/assign/${volunteerId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "Erreur lors de la désassignation du volontaire")
  }
}
