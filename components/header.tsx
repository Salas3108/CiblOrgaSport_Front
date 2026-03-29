"use client"

import { useState } from "react"
import { User, Trophy, LogOut, Menu, X, ChevronDown } from "lucide-react"
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

const ROLE_COLORS: Record<string, string> = {
  admin: "from-red-500 to-rose-600",
  commissaire: "from-purple-500 to-violet-600",
  athlete: "from-blue-500 to-cyan-600",
  volunteer: "from-green-500 to-emerald-600",
  spectator: "from-gray-500 to-slate-600",
  ADMIN: "from-red-500 to-rose-600",
  COMMISSAIRE: "from-purple-500 to-violet-600",
  ATHLETE: "from-blue-500 to-cyan-600",
  VOLONTAIRE: "from-green-500 to-emerald-600",
  USER: "from-gray-500 to-slate-600",
}

export function Header() {
  const { user, logout, isAuthenticated } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : ""
  const roleColor = user?.role ? (ROLE_COLORS[user.role] ?? "from-blue-500 to-cyan-600") : "from-blue-500 to-cyan-600"
  const initials = (user?.name ?? user?.username ?? user?.role ?? "?").slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/10 shadow-xl">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-6 gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-green-900/40 group-hover:scale-105 transition-transform">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-bold text-white tracking-wide">CiblOrgaSport</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5 tracking-wider uppercase">European Swimming 2026</p>
            </div>
          </Link>

          {/* Nav desktop */}
          <div className="flex-1 flex justify-center">
            <RoleBasedNav />
          </div>

          {/* Actions droite */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated && (
              <div className="text-white">
                <NotificationCenter />
              </div>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                    {initials}
                  </div>
                  <div className="hidden md:block text-left leading-tight">
                    <p className="text-xs font-semibold text-white leading-none">{user?.name ?? user?.username ?? "Utilisateur"}</p>
                    <p className="text-[10px] text-slate-400 leading-none mt-0.5">{roleLabel}</p>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden md:block transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                      <div className={`px-4 py-3 bg-gradient-to-r ${roleColor}`}>
                        <p className="text-sm font-bold text-white truncate">{user?.name ?? user?.username}</p>
                        <p className="text-xs text-white/80 mt-0.5">{roleLabel}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-gray-500" />
                          </div>
                          Mon profil
                        </Link>

                        {/* Compléter profil (rôle spécifique) */}
                        {(() => {
                          const roleKey = (user?.role ?? "").toLowerCase()
                          if (roleKey === "athlete") {
                            return (
                              <Link
                                href="/athlete"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <User className="h-3.5 w-3.5 text-gray-500" />
                                </div>
                                Compléter profil
                              </Link>
                            )
                          }
                          if (roleKey === "volunteer" || roleKey === "volontaire") {
                            return (
                              <Link
                                href="/volunteer/profile"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <User className="h-3.5 w-3.5 text-gray-500" />
                                </div>
                                Compléter profil
                              </Link>
                            )
                          }
                          return null
                        })()}
                        <div className="mx-3 border-t border-gray-100 my-1" />
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false) }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                            <LogOut className="h-3.5 w-3.5 text-red-500" />
                          </div>
                          Se déconnecter
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-400 hover:to-green-500 transition-all shadow-lg shadow-green-900/30"
              >
                Se connecter
              </Link>
            )}

            <button
              className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-colors text-white"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur border-b border-white/10 px-4 py-3">
          <RoleBasedNav mobile onClose={() => setMobileOpen(false)} />
        </div>
      )}
    </header>
  )
}
