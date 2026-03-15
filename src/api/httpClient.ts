import axios from 'axios';

// Tout passe par le gateway sur le port 8080
const GATEWAY = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export const apiBases = {
  // Tous les services passent par le gateway
  auth: GATEWAY,
  events: GATEWAY,
  incidents: GATEWAY,
  billetterie: GATEWAY,
  notifications: GATEWAY,
};

// Shared Axios instance
export const http = axios.create({
  // No global baseURL; we compose full paths per microservice to avoid hardcoding.
});

// Attach JWT from localStorage on each request
http.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Ensure headers is an AxiosHeaders instance to satisfy TS types
  const AxiosHeadersCtor = (axios as any).AxiosHeaders;
  if (!(config.headers instanceof AxiosHeadersCtor)) {
    config.headers = new AxiosHeadersCtor(config.headers);
  }

  if (token) {
    // Use .set to avoid type conflicts
    (config.headers as InstanceType<typeof AxiosHeadersCtor>).set('Authorization', `Bearer ${token}`);
  }

  return config;
});
