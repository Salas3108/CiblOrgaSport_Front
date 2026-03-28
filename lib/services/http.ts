const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://137.74.133.131"

function toQuery(params?: Record<string, unknown>) {
  if (!params) return ""
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    q.append(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ""
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`)
  }
  // Handle no-content
  if (res.status === 204) return undefined as unknown as T
  return (await res.json()) as T
}

export const http = {
  get<T>(path: string, params?: Record<string, unknown>) {
    return request<T>(`${path}${toQuery(params)}`)
  },
  post<T>(path: string, body?: unknown) {
    return request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined })
  },
  put<T>(path: string, body?: unknown) {
    return request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined })
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined })
  },
  delete<T>(path: string) {
    return request<T>(path, { method: "DELETE" })
  },
}
