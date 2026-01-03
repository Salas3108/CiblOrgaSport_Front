import { http, apiBases } from './httpClient';
import type { AxiosResponse } from 'axios';

const base = apiBases.incidents;

export const createIncident = (payload: {
  description: string;
  impactLevel: string;
  type: string;
  location: string;
  reportedBy: string;
}) => http.post(`${base}/api/incidents`, payload).then((r: AxiosResponse<any>) => r.data);

export const getIncidents = (params?: { status?: string; type?: string }) =>
  http.get(`${base}/api/incidents`, { params }).then((r: AxiosResponse<any>) => r.data);

export const getIncidentById = (id: number | string) =>
  http.get(`${base}/api/incidents/${id}`).then((r: AxiosResponse<any>) => r.data);

export const updateIncident = (id: number | string, payload: any) =>
  http.put(`${base}/api/incidents/${id}`, payload).then((r: AxiosResponse<any>) => r.data);

export const deleteIncident = (id: number | string) =>
  http.delete(`${base}/api/incidents/${id}`).then((r: AxiosResponse<any>) => r.status);
