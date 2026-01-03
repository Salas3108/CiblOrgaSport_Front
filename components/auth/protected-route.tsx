"use client"

import { ReactNode, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

type ProtectedRouteProps = {
  allowedRoles?: string[]
  children: React.ReactNode
}

export function ProtectedRoute({ allowedRoles = [], children }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  const isAuthenticated = !!session?.user
  const u = session?.user as { role?: string; roles?: string[] } | undefined
  const userRoles: string[] = Array.isArray(u?.roles) ? u!.roles! : (u?.role ? [u.role] : [])
  const hasAccess =
    allowedRoles.length === 0
      ? isAuthenticated
      : isAuthenticated && allowedRoles.some((role) => userRoles.includes(role))

  // Show a minimal loading state while session checks
  if (status === "loading") {
    return <span style={{ display: "inline-block" }}>Chargement…</span>
  }

  // Unauthenticated: show a tiny hint instead of returning null
  if (!isAuthenticated) {
    return <span style={{ display: "inline-block" }}>Veuillez vous connecter.</span>
  }

  // Authenticated but lacks role access
  if (!hasAccess) {
    return <span style={{ display: "inline-block" }}>Accès refusé.</span>
  }

  return <>{children}</>
}
