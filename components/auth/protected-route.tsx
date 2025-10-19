"use client"

import type React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles = [], redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = redirectTo
      return
    }

    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
      window.location.href = "/"
      return
    }
  }, [isAuthenticated, user, allowedRoles, redirectTo])

  if (!isAuthenticated) {
    return <div>Redirecting...</div>
  }

  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return <div>Access denied</div>
  }

  return <>{children}</>
}
