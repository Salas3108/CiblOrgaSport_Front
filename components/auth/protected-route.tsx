"use client"

import { ReactNode } from "react"
import { useAuth } from "@/components/auth/auth-provider"

type ProtectedRouteProps = {
  allowedRoles?: string[]
  children: React.ReactNode
}

export function ProtectedRoute({ allowedRoles = [], children }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const userRoles = user?.role ? [user.role] : []
  const hasAccess =
    allowedRoles.length === 0
      ? isAuthenticated
      : isAuthenticated && allowedRoles.some((role) => userRoles.includes(role))

  if (!isAuthenticated) {
    return <span style={{ display: "inline-block" }}>Veuillez vous connecter.</span>
  }

  if (!hasAccess) {
    return <span style={{ display: "inline-block" }}>Accès refusé.</span>
  }

  return <>{children}</>
}
