import axios from 'axios';

// Bases read from environment to remove hardcoded URLs:
export const apiBases = {
  auth: 'http://localhost:8081',
  events: 'http://localhost:8080',
  incidents: 'http://localhost:8084',
  billetterie: 'http://localhost:8083',
};

// Shared Axios instance
export const http = axios.create({
  // No global baseURL; we compose full paths per microservice to avoid hardcoding.
});

// Attach JWT from localStorage on each request
http.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;

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
