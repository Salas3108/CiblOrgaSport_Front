"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type StoredUser = {
  username?: string
  email?: string
  role?: string
  uiRole?: string
  name?: string
  authenticated?: boolean
  type?: string
}

type DebugInfo = {
  authBase: string | null
  username: string | undefined
  tokenExists: boolean
  requestUrl: string | null
  error: string | null
  response: any
}

export default function ProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null)
  const [tokenPreview, setTokenPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    authBase: null,
    username: undefined,
    tokenExists: false,
    requestUrl: null,
    error: null,
    response: null
  })
  const [showDebug, setShowDebug] = useState(false)

  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const authBase = "http://localhost:8081"

      const getUsernameFromToken = (jwt?: string | null): string | undefined => {
        if (!jwt) return undefined
        const parts = jwt.split(".")
        if (parts.length < 2) return undefined
        try {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))
          return (
            payload?.preferred_username ||
            payload?.username ||
            (typeof payload?.sub === "string" ? payload.sub : undefined) ||
            (typeof payload?.email === "string" ? payload.email.split("@")[0] : undefined)
          )
        } catch {
          return undefined
        }
      }

      const safeParse = (raw: string | null): any => {
        if (!raw) return null
        try {
          return JSON.parse(raw)
        } catch {
          return null
        }
      }

      const getStored = () => {
        if (typeof window === "undefined") return { token: null, username: undefined }
        const lsUser = localStorage.getItem("user") || localStorage.getItem("userInfo")
        const ssUser = sessionStorage.getItem("user") || sessionStorage.getItem("userInfo")
        const parsedUser = safeParse(lsUser) || safeParse(ssUser)

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("token") ||
          sessionStorage.getItem("accessToken")

        const username: string | undefined =
          (parsedUser?.username as string | undefined) ||
          (parsedUser?.user?.username as string | undefined) ||
          getUsernameFromToken(token)

        return { token, username }
      }

      const { token, username } = getStored()
      setTokenPreview(token ? `${token.slice(0, 8)}...` : null)

      setDebugInfo(prev => ({
        ...prev,
        authBase,
        username,
        tokenExists: !!token,
        requestUrl: null,
        error: null,
        response: null
      }))

      if (!token) {
        setUser({ authenticated: false })
        setError("Aucun jeton trouvé. Veuillez vous reconnecter.")
        setDebugInfo(prev => ({ ...prev, error: "No token found" }))
        return
      }

      if (!username) {
        setUser({ authenticated: false })
        setError("Impossible de déterminer l'utilisateur à partir du jeton.")
        setDebugInfo(prev => ({ ...prev, error: "No username found" }))
        return
      }

      if (!authBase) {
        setUser({ authenticated: false })
        setError("Configuration manquante: NEXT_PUBLIC_AUTH_BASE et aucun fallback disponible.")
        setDebugInfo(prev => ({ ...prev, error: "No auth base URL" }))
        return
      }

      const encodedUsername = encodeURIComponent(username.toString().trim())
      if (!encodedUsername) {
        setUser({ authenticated: false })
        setError("Nom d'utilisateur vide ou invalide.")
        setDebugInfo(prev => ({ ...prev, error: "Empty or invalid username" }))
        return
      }

      const requestUrl = `${authBase}/auth/user/username/${encodedUsername}`
      
      setDebugInfo(prev => ({
        ...prev,
        requestUrl
      }))

      const response = await fetch(requestUrl!, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        setDebugInfo(prev => ({ 
          ...prev, 
          error: `HTTP ${response.status}: ${errorText}`,
          response: { status: response.status, text: errorText }
        }))
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      setDebugInfo(prev => ({ ...prev, response: data }))

      setUser({
        authenticated: true,
        username: data?.username || username,
        email: data?.email,
        role: data?.role,
        uiRole: data?.role,
        name: data?.username || username,
        type: "Bearer",
      })
      setError(null)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Impossible de charger le profil: ${errorMessage}`)
      setUser({ authenticated: false })
      setDebugInfo(prev => ({ ...prev, error: errorMessage }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement du profil…</p>
        </div>
      </div>
    )
  }

  if (!user?.authenticated) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 mb-6">
          <Link href="/login">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Se connecter
            </button>
          </Link>
          <button 
            onClick={loadProfile}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Réessayer
          </button>
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            {showDebug ? "Masquer le debug" : "Afficher le debug"}
          </button>
        </div>

        {showDebug && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Informations de débogage</h3>
            </div>
            <div className="p-4 space-y-3 text-sm bg-white">
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium text-gray-700">Auth Base:</div>
                <div className="col-span-2 font-mono text-gray-900">{debugInfo.authBase || "Non défini"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium text-gray-700">Username:</div>
                <div className="col-span-2 font-mono text-gray-900">{debugInfo.username || "Non trouvé"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium text-gray-700">Token existe:</div>
                <div className="col-span-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${debugInfo.tokenExists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.tokenExists ? "Oui" : "Non"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium text-gray-700">URL de requête:</div>
                <div className="col-span-2 font-mono text-gray-900 break-all">{debugInfo.requestUrl || "Non générée"}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium text-gray-700">Erreur:</div>
                <div className="col-span-2">
                  {debugInfo.error ? (
                    <span className="font-mono text-red-600">{debugInfo.error}</span>
                  ) : (
                    <span className="text-gray-500">Aucune</span>
                  )}
                </div>
              </div>
              {debugInfo.response && (
                <div>
                  <div className="font-medium text-gray-700 mb-2">Réponse:</div>
                  <pre className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded text-xs overflow-auto max-h-64">
                    {JSON.stringify(debugInfo.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Profil utilisateur</h2>
          <p className="mt-1 text-sm text-gray-600">Informations de votre compte</p>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nom d'utilisateur</div>
              <div className="text-lg font-medium text-gray-900">{user?.username || "-"}</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nom affiché</div>
              <div className="text-lg font-medium text-gray-900">{user?.name || user?.username || "-"}</div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</div>
              <div className="text-lg font-medium text-gray-900 flex items-center">
                {user?.email || "-"}
                {user?.email && (
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Vérifié</span>
                )}
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle (backend)</div>
              <div className="text-lg font-medium text-gray-900">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  {user?.role || "-"}
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle (UI)</div>
              <div className="text-lg font-medium text-gray-900">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                  {user?.uiRole || "-"}
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type de token</div>
              <div className="text-lg font-medium text-gray-900">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {user?.type || "-"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Token d'accès</div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono text-gray-700">
                {tokenPreview || "Aucun token"}
              </code>
              <button 
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {showDebug ? "Masquer les détails" : "Afficher les détails"}
              </button>
            </div>
          </div>
          
          <div className="pt-6 flex flex-wrap gap-3">
            <Link href="/">
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                ← Retour à l'accueil
              </button>
            </Link>
            <button 
              onClick={loadProfile}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Actualiser
            </button>
          </div>
        </div>
      </div>
      
      {showDebug && (
        <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Détails techniques</h3>
          </div>
          <div className="p-4 space-y-3 text-sm bg-white">
            <div className="grid grid-cols-3 gap-2">
              <div className="font-medium text-gray-700">Auth Base:</div>
              <div className="col-span-2 font-mono text-gray-900">{debugInfo.authBase || "Non défini"}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="font-medium text-gray-700">URL de requête:</div>
              <div className="col-span-2 font-mono text-gray-900 break-all">{debugInfo.requestUrl || "Non générée"}</div>
            </div>
            {debugInfo.response && (
              <div>
                <div className="font-medium text-gray-700 mb-2">Réponse complète:</div>
                <pre className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(debugInfo.response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}