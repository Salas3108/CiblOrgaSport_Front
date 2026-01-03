"use client"

import type { ReactNode } from "react"

export default function ClientProviders({ children }: { children: ReactNode }) {
  // Add any client-only hooks, effects, or context here if needed.
  return <>{children}</>
}
