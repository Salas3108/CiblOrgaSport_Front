import { http, apiBases } from './httpClient';
import type { AxiosResponse } from 'axios';

const base = apiBases.auth;

export const login = (payload: { username: string; password: string }) =>
  http.post(`${base}/auth/login`, payload).then((r: AxiosResponse<any>) => r.data);

export const register = (payload: any) =>
  http.post(`${base}/auth/register`, payload).then((r: AxiosResponse<any>) => r.data);

export const hello = () => http.get(`${base}/auth/hello`).then((r: AxiosResponse<any>) => r.data);

export const getUserByUsername = (username: string) =>
  http.get(`${base}/auth/user/username/${encodeURIComponent(username)}`).then((r: AxiosResponse<any>) => r.data);

export const uploadUserDocuments = (formData: FormData) =>
  http.post(`${base}/auth/user/upload-documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r: AxiosResponse<any>) => r.data);

export const adminValidateAthlete = (payload: any) =>
  http.post(`${base}/auth/admin/validate-athlete`, payload).then((r: AxiosResponse<any>) => r.data);

// Utility to persist token after login
export const persistToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('jwt', token);
  }
};

export const getMe = () =>
  http.get(`${base}/auth/me`).then((r: AxiosResponse<any>) => r.data);

// Optional: helper to set Authorization header dynamically
export const setAuthToken = (token: string) => {
  persistToken(token);
  (http.defaults.headers.common as any)['Authorization'] = `Bearer ${token}`;
};
