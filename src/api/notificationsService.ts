import type { AxiosResponse } from "axios"
import { apiBases, http } from "./httpClient"

const base = apiBases.notifications || "http://137.74.133.131"

export interface BackendNotificationDTO {
  id: number
  type: string
  contenu: string
  dateEnvoi: string
  idEvent: number | null
  idSpectateur: number | null
  sourceEventId: string | null
  lu: boolean
}

export interface UnreadCounterResponse {
  nonLues: number
}

export interface MarkAllReadResponse {
  mis_a_jour: number
}

export const getSpectatorNotifications = (spectatorId: string | number) =>
  http
    .get<BackendNotificationDTO[]>(`${base}/api/notifications/spectateur/${spectatorId}`)
    .then((response: AxiosResponse<BackendNotificationDTO[]>) => response.data)

export const getUnreadSpectatorNotifications = (spectatorId: string | number) =>
  http
    .get<BackendNotificationDTO[]>(`${base}/api/notifications/spectateur/${spectatorId}/non-lues`)
    .then((response: AxiosResponse<BackendNotificationDTO[]>) => response.data)

export const getUnreadNotificationsCount = (spectatorId: string | number) =>
  http
    .get<UnreadCounterResponse>(`${base}/api/notifications/spectateur/${spectatorId}/compteur`)
    .then((response: AxiosResponse<UnreadCounterResponse>) => response.data)

export const markNotificationAsRead = (notificationId: string | number) =>
  http
    .patch<BackendNotificationDTO>(`${base}/api/notifications/${notificationId}/lue`)
    .then((response: AxiosResponse<BackendNotificationDTO>) => response.data)

export const markAllSpectatorNotificationsAsRead = (spectatorId: string | number) =>
  http
    .patch<MarkAllReadResponse>(`${base}/api/notifications/spectateur/${spectatorId}/tout-lire`)
    .then((response: AxiosResponse<MarkAllReadResponse>) => response.data)

export const deleteNotificationById = (notificationId: string | number) =>
  http.delete(`${base}/api/notifications/${notificationId}`)
