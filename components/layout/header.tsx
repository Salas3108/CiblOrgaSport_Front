"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const user = typeof window !== "undefined" ? localStorage.getItem("user") : null
    try {
      const parsed = user ? JSON.parse(user) : null
      setIsAuthenticated(!!parsed?.authenticated)
    } catch {
      setIsAuthenticated(false)
    }
  }, [])

  return (
    <header className="flex items-center justify-between px-4 py-2">
      {/* ...existing code... logo, nav, etc. ... */}
      <div className="flex items-center gap-2">
        {/* ...existing code... other header actions ... */}
        {isAuthenticated ? (
          <Link href="/profile">
            <Button>Profile</Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button>Login</Button>
          </Link>
        )}
      </div>
    </header>
  )
}
