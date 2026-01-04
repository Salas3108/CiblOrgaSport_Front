"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface User {
  email: string
  role: string
  name: string
  authenticated: boolean
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type Props = { children: React.ReactNode }

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null)

  // Map backend enum roles to UI role keys
  const BACKEND_TO_UI_ROLE: Record<string, string> = {
    USER: "spectator",
    ROLE_USER: "spectator",
    ATHLETE: "athlete",
    ROLE_ATHLETE: "athlete",
    ADMIN: "admin",
    ROLE_ADMIN: "admin",
    COMMISSAIRE: "commissaire",
    ROLE_COMMISSAIRE: "commissaire",
    VOLONTAIRE: "volunteer",
    ROLE_VOLONTAIRE: "volunteer",
  }

  const normalizeStoredUser = (raw: any): User | null => {
    if (!raw) return null
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
      if (!parsed.authenticated) return null
      // prefer explicit uiRole if present (set by login form), otherwise map backend enum
      let uiRole = parsed.uiRole || (parsed.role ? BACKEND_TO_UI_ROLE[String(parsed.role).toUpperCase()] : undefined)
      // if still no uiRole, try decode token from localStorage
      if (!uiRole && typeof window !== "undefined") {
        const token = localStorage.getItem("token")
        if (token) {
          try {
            const parts = token.split('.')
            if (parts.length >= 2) {
              const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
              const json = decodeURIComponent(atob(payload).split('').map(function(c:any) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
              }).join(''))
              const p = JSON.parse(json)
              const candidates: string[] = []
              if (p.role) candidates.push(String(p.role))
              if (p.roles && Array.isArray(p.roles)) candidates.push(...p.roles.map(String))
              if (p.authorities && Array.isArray(p.authorities)) candidates.push(...p.authorities.map(String))
              if (p.realm_access && Array.isArray(p.realm_access.roles)) candidates.push(...p.realm_access.roles.map(String))
              const found = candidates.map(c => c.toUpperCase()).find(c => BACKEND_TO_UI_ROLE[c])
              if (found) uiRole = BACKEND_TO_UI_ROLE[found]
            }
          } catch (e) {
            // ignore
          }
        }
      }
      if (!uiRole) {
        // If we can't determine a uiRole, still return user but role will be raw value lowercased
        return {
          email: parsed.email || "",
          role: (parsed.role || "").toString().toLowerCase(),
          name: parsed.name || parsed.username || "",
          authenticated: true,
        }
      }
      return {
        email: parsed.email || "",
        role: uiRole,
        name: parsed.name || parsed.username || "",
        authenticated: true,
      }
    } catch (e) {
      return null
    }
  }

  useEffect(() => {
    // Check for stored user data on mount
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      const normalized = normalizeStoredUser(storedUser)
      if (normalized) {
        setUser(normalized)
        // ensure stored form is consistent: persist a normalized version (keep raw keys too)
        try {
          const parsed = JSON.parse(storedUser)
          const toStore = {
            ...parsed,
            role: parsed.role ?? parsed.uiRole ?? normalized.role,
            uiRole: parsed.uiRole ?? normalized.role,
            authenticated: true,
          }
          localStorage.setItem("user", JSON.stringify(toStore))
        } catch (e) {
          // ignore
        }
      } else {
        localStorage.removeItem("user")
      }
    }
  }, [])

  const login = (userData: any) => {
    // Accept either backend-shaped or normalized userData
    const parsed = typeof userData === "string" ? JSON.parse(userData) : userData
    const normalized = normalizeStoredUser(parsed) || {
      email: parsed.email || "",
      role: (parsed.role || parsed.uiRole || "").toString().toLowerCase(),
      name: parsed.name || parsed.username || "",
      authenticated: true,
    }
    setUser(normalized)
    // persist original plus uiRole for future consistency
    const toStore = { ...(parsed || {}), role: parsed.role ?? normalized.role, uiRole: normalized.role, authenticated: true }
    localStorage.setItem("user", JSON.stringify(toStore))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    window.location.href = "/login"
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user?.authenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
