import { http, apiBases } from './httpClient';
import type { AxiosResponse } from 'axios';

const base = apiBases.abonnement || 'http://localhost:8082';

export const getUserSubscriptions = (userId: string | number) =>
  http.get(`${base}/api/abonnements/user/${userId}`).then((r: AxiosResponse<any>) => r.data);

export const subscribeToCompetition = (userId: string | number, competitionId: string) =>
  http.post(`${base}/api/abonnements/subscribe?userId=${userId}&competitionId=${competitionId}`)
    .then((r: AxiosResponse<any>) => r.data);

export const unsubscribeFromCompetition = (userId: string | number, competitionId: string) =>
  http.delete(`${base}/api/abonnements/unsubscribe?userId=${userId}&competitionId=${competitionId}`)
    .then((r: AxiosResponse<any>) => r.data);

export const updateNotificationPreferences = (userId: string | number, preferences: any) =>
  http.put(`${base}/api/abonnements/preferences/${userId}`, preferences)
    .then((r: AxiosResponse<any>) => r.data);
