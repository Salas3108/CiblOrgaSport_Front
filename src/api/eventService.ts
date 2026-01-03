import { http, apiBases } from './httpClient';
import type { AxiosResponse } from 'axios';

const base = apiBases.events;

export const listLieux = (params?: Record<string, any>) =>
  http.get(`${base}/lieux`, { params }).then((r: AxiosResponse<any>) => r.data);
export const getLieu = (id: number) =>
  http.get(`${base}/lieux/${id}`).then((r: AxiosResponse<any>) => r.data);
export const createLieu = (payload: any) =>
  http.post(`${base}/lieux`, payload).then((r: AxiosResponse<any>) => r.data);
export const updateLieu = (id: number, payload: any) =>
  http.put(`${base}/lieux/${id}`, payload).then((r: AxiosResponse<any>) => r.data);
export const deleteLieu = (id: number) =>
  http.delete(`${base}/lieux/${id}`).then((r: AxiosResponse<any>) => r.data);

export const listEvents = () =>
  http.get(`${base}/events`).then((r: AxiosResponse<any>) => r.data);
export const getEvent = (id: number) =>
  http.get(`${base}/events/${id}`).then((r: AxiosResponse<any>) => r.data);
export const createEvent = (payload: { name: string; location: string; date: string }) =>
  http.post(`${base}/events`, payload).then((r: AxiosResponse<any>) => r.data);
export const updateEvent = (id: number, payload: any) =>
  http.put(`${base}/events/${id}`, payload).then((r: AxiosResponse<any>) => r.data);
export const deleteEvent = (eventId: number | string) =>
  http.delete(`${base}/events/${eventId}`).then((r: AxiosResponse<any>) => r.status);

export const listEpreuves = (params?: Record<string, any>) =>
  http.get(`${base}/epreuves`, { params }).then((r: AxiosResponse<any>) => r.data);
export const getEpreuve = (id: number) =>
  http.get(`${base}/epreuves/${id}`).then((r: AxiosResponse<any>) => r.data);
export const createEpreuve = (payload: any) =>
  http.post(`${base}/epreuves`, payload).then((r: AxiosResponse<any>) => r.data);
export const updateEpreuve = (id: number, payload: any) =>
  http.put(`${base}/epreuves/${id}`, payload).then((r: AxiosResponse<any>) => r.data);
export const deleteEpreuve = (id: number) =>
  http.delete(`${base}/epreuves/${id}`).then((r: AxiosResponse<any>) => r.data);

export const listCompetitions = (params?: Record<string, any>) =>
  http.get(`${base}/competitions`, { params }).then((r: AxiosResponse<any>) => r.data);
export const getCompetition = (id: number) =>
  http.get(`${base}/competitions/${id}`).then((r: AxiosResponse<any>) => r.data);
export const createCompetition = (payload: any) =>
  http.post(`${base}/competitions`, payload).then((r: AxiosResponse<any>) => r.data);
export const updateCompetition = (id: number, payload: any) =>
  http.put(`${base}/competitions/${id}`, payload).then((r: AxiosResponse<any>) => r.data);
export const deleteCompetition = (id: number) =>
  http.delete(`${base}/competitions/${id}`).then((r: AxiosResponse<any>) => r.data);

// Admin-only
export const adminListEvents = () =>
  http.get(`${base}/admin/events`).then((r: AxiosResponse<any>) => r.data);
export const adminCreateEvent = (payload: any) =>
  http.post(`${base}/admin/events`, payload).then((r: AxiosResponse<any>) => r.data);
export const adminDeleteEvent = (id: number) =>
  http.delete(`${base}/admin/events/${id}`).then((r: AxiosResponse<any>) => r.data);
export const adminAddCompetitionToEvent = (eventId: number, payload: any) =>
  http.post(`${base}/admin/events/${eventId}/competitions`, payload).then((r: AxiosResponse<any>) => r.data);
export const adminAddEpreuveToCompetition = (competitionId: number, payload: any) =>
  http.post(`${base}/admin/events/competitions/${competitionId}/epreuves`, payload).then((r: AxiosResponse<any>) => r.data);

export const addCompetitionToEvent = (eventId: number | string, payload: { name: string; date: string; type: string }) =>
  http.post(`${base}/admin/events/${eventId}/competitions`, payload).then((r: AxiosResponse<any>) => r.data);

export const addEpreuveToCompetition = (competitionId: number | string, payload: { nom: string; description?: string }) =>
  http.post(`${base}/admin/events/competitions/${competitionId}/epreuves`, payload).then((r: AxiosResponse<any>) => r.data);
