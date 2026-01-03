import { http, apiBases } from './httpClient';
import type { AxiosResponse } from 'axios';

const base = apiBases.auth;

// Récupérer la liste des athlètes (ADMIN)
export async function fetchAthletes(validated?: boolean) {
  const token = localStorage.getItem('token');
  let url = 'http://localhost:8080/auth/admin/athletes';
  if (validated !== undefined) url += `?validated=${validated}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error('Erreur API');
  return res.json();
}

// Valider ou rejeter un athlète (ADMIN)
export async function adminValidateAthlete(payload: { username: string; validated: boolean }) {
  const token = localStorage.getItem('token');
  const res = await fetch('http://localhost:8080/auth/admin/validate-athlete', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  // Lire le body en texte d'abord pour éviter "body stream already read"
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  if (!res.ok) {
    // Si le backend renvoie une erreur HTTP, lancer avec le message disponible
    const message = typeof data === 'string' ? data : (data?.message || 'Erreur API');
    throw new Error(message);
  }

  return data;
}

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

// (removed duplicate adminValidateAthlete that used axios/http client)

// Utility to persist token after login
export const persistToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const getMe = () =>
  http.get(`${base}/auth/me`).then((r: AxiosResponse<any>) => r.data);

// Optional: helper to set Authorization header dynamically
export const setAuthToken = (token: string) => {
  persistToken(token);
  (http.defaults.headers.common as any)['Authorization'] = `Bearer ${token}`;
};

export const adminListPendingUsers = async (role?: string) => {
  const response = await fetch(`/api/admin/pending-users${role ? `?role=${role}` : ''}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch pending users');
  }

  return response.json();
};

export const adminValidateVolunteer = async (data: {
  username: string;
  validated: boolean;
  accreditation?: string;
  affectation?: string;
}) => {
  const response = await fetch('/api/admin/validate-volunteer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to validate volunteer');
  }

  return response.json();
};

export const adminValidateOfficiel = async (data: {
  username: string;
  validated: boolean;
  accreditation?: string;
  zone_responsabilite?: string;
  type?: string;
}) => {
  const response = await fetch('/api/admin/validate-official', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to validate official');
  }

  return response.json();
};

export const adminCreateAccount = async (data: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  additionalData: any;
}) => {
  const response = await fetch('/api/admin/create-account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create account');
  }

  return response.json();
};
