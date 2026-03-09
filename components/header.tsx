"use client"

import { useState } from "react"
import { User, Trophy, LogOut, Menu, X, Bell } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import Link from "next/link"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { RoleBasedNav } from "@/components/navigation/role-based-nav"

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  commissaire: "Commissaire",
  athlete: "Athlète",
  volunteer: "Volontaire",
  spectator: "Spectateur",
  ADMIN: "Administrateur",
  COMMISSAIRE: "Commissaire",
  ATHLETE: "Athlète",
  VOLONTAIRE: "Volontaire",
  USER: "Spectateur",
}

export function Header() {
  const { user, logout, isAuthenticated } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : ""
  const initials = (user?.name ?? user?.role ?? "?").slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-screen-xl mx-auto flex h-14 items-center justify-between px-4 gap-4">

        {/* ── Logo ── */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0 group"
        >
          <div className="h-8 w-8 rounded-xl bg-green-600 flex items-center justify-center shadow-sm group-hover:bg-green-700 transition-colors">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-bold text-gray-900 leading-none">CiblOrgaSport</p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">European Swimming 2026</p>
          </div>
        </Link>

        {/* ── Nav desktop ── */}
        <div className="flex-1 flex justify-center">
          <RoleBasedNav />
        </div>

        {/* ── Actions droite ── */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && <NotificationCenter />}

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <p className="text-xs font-semibold text-gray-800 leading-none">{user?.name ?? "Utilisateur"}</p>
                  <p className="text-[10px] text-gray-400 leading-none mt-0.5">{roleLabel}</p>
                </div>
                <svg className="w-3 h-3 text-gray-400 hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-400">{roleLabel}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      Mon profil
                    </Link>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Se déconnecter
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
            >
              Se connecter
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-4 w-4 text-gray-600" /> : <Menu className="h-4 w-4 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* ── Mobile nav ── */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3">
          <RoleBasedNav mobile onClose={() => setMobileOpen(false)} />
        </div>
      )}
    </header>
  )
}
