import axios from 'axios';
import { toast } from 'sonner';

// Tout passe par le gateway sur le port 8080
const GATEWAY = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://137.74.133.131';

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
  const token = typeof window !== 'undefined'
    ? (
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('token') ||
      sessionStorage.getItem('accessToken')
    )
    : null;

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

// ── Response interceptor — affichage des erreurs métier ────────────────────
function getDefaultMessage(status: number | undefined): string {
  if (status === 400) return "Données invalides."
  if (status === 403) return "Accès refusé. Vérifiez vos droits."
  if (status === 404) return "Ressource introuvable."
  if (status === 422) return "Données non traitables. Vérifiez les champs envoyés."
  if (status === 500) return "Erreur serveur. Réessayez plus tard."
  return "Une erreur est survenue."
}

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === 'undefined') return Promise.reject(error)

    const skipGlobalErrorHandler = Boolean((error as any)?.config?.skipGlobalErrorHandler)
    if (skipGlobalErrorHandler) {
      return Promise.reject(error)
    }

    const status: number | undefined = error.response?.status
    const data = error.response?.data

    // 401 : session expirée → redirection login (sans toast bloquant)
    if (status === 401) {
      toast.error("Session expirée, veuillez vous reconnecter", { duration: 3000 })
      setTimeout(() => { window.location.href = '/login' }, 1500)
      return Promise.reject(error)
    }

    // Message explicite du backend en priorité (cas 400 genre incompatible, etc.)
    const backendMessage: string | undefined =
      typeof data?.message === 'string' ? data.message :
      typeof data?.error === 'string' && status !== 500 ? data.error :
      undefined

    // 409 Conflict → toast orange (warning)
    if (status === 409) {
      toast.warning(`Conflit : ${backendMessage ?? "opération impossible."}`, { duration: 5000 })
      return Promise.reject(error)
    }

    const message = backendMessage || getDefaultMessage(status)
    toast.error(message, { duration: 5000 })

    return Promise.reject(error)
  }
);
