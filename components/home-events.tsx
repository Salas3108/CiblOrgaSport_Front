// components/home-events.tsx - VERSION AVEC ID UTILISATEUR STABLE
"use client"
import React, { useEffect, useState } from 'react'

export default function HomeEvents() {
  const [competitions, setCompetitions] = useState<any[]>([])
  const [abonnements, setAbonnements] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string>('')

  // Fonction pour générer un ID STABLE basé sur le nom d'utilisateur/email
  const getStableUserId = (): number => {
    try {
      // 1. Essayer de récupérer depuis localStorage 'user'
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        
        // Si l'utilisateur a un ID numérique, l'utiliser
        if (user.id && typeof user.id === 'number') {
          return user.id
        }
        
        // Si l'ID est une chaîne numérique
        if (user.id && typeof user.id === 'string') {
          const numericId = parseInt(user.id, 10)
          if (!isNaN(numericId)) {
            return numericId
          }
        }
        
        // Générer un ID STABLE à partir du nom d'utilisateur/email
        const identifier = user.username || user.email || user.name || 'default'
        let hash = 0
        for (let i = 0; i < identifier.length; i++) {
          const char = identifier.charCodeAt(i)
          hash = ((hash << 5) - hash) + char
          hash = hash & hash // Convertir en 32-bit integer
        }
        return Math.abs(hash) % 10000 + 1000 // ID stable entre 1000 et 10999
      }
      
      // 2. Essayer depuis le token JWT
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]))
          if (payload.sub || payload.email || payload.username) {
            const identifier = payload.sub || payload.email || payload.username
            let hash = 0
            for (let i = 0; i < identifier.length; i++) {
              hash = ((hash << 5) - hash) + identifier.charCodeAt(i)
              hash = hash & hash
            }
            return Math.abs(hash) % 10000 + 1000
          }
        } catch (e) {
          console.log('Token non JWT')
        }
      }
      
      // 3. Si pas d'utilisateur, retourner un ID par défaut
      return 1
      
    } catch (error) {
      console.error('Erreur:', error)
      return 1
    }
  }

  // Fonction pour récupérer le nom d'utilisateur
  const getUserName = (): string => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        return user.name || user.username || user.email || 'Utilisateur'
      }
      return 'Utilisateur'
    } catch {
      return 'Utilisateur'
    }
  }

  // Convertir ID compétition en UUID
  const convertToUUID = (id: string | number): string => {
    const num = typeof id === 'string' ? parseInt(id, 10) : id
    if (isNaN(num)) return '00000000-0000-0000-0000-000000000000'
    
    const hex = num.toString(16).padStart(12, '0')
    return `00000000-0000-0000-0000-${hex}`
  }

  // Initialisation
  useEffect(() => {
    const initUser = () => {
      const id = getStableUserId()
      const name = getUserName()
      setUserId(id)
      setUserName(name)
      console.log(`Utilisateur initialisé: ${name} (ID: ${id})`)
    }
    
    initUser()
  }, [])

  // Charger les compétitions
  useEffect(() => {
    const loadCompetitions = async () => {
      if (!userId) return
      
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        const response = await fetch('http://localhost:8080/competitions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const transformed = Array.isArray(data) ? data.map((comp: any) => ({
            ...comp,
            originalId: comp.id,
            uuidId: convertToUUID(comp.id)
          })) : []
          
          setCompetitions(transformed)
        }
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadCompetitions()
  }, [userId])

  // Charger les abonnements
  const loadAbonnements = async () => {
    if (!userId) return
    
    try {
      console.log(`Chargement abonnements pour user ID: ${userId} (${userName})`)
      const response = await fetch(`http://localhost:8085/api/abonnements/user/${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          const competitionIds = data.map((ab: any) => ab.competitionId)
          setAbonnements(new Set(competitionIds))
          console.log(`${userName} a ${competitionIds.length} abonnement(s)`)
        }
      } else if (response.status === 404) {
        setAbonnements(new Set())
        console.log(`${userName} n'a pas d'abonnements`)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  // S'abonner
  const handleSAbonner = async (competition: any, competitionName: string) => {
    if (!userId) {
      alert('Veuillez vous connecter')
      return
    }
    
    try {
      const response = await fetch(
        `http://localhost:8085/api/abonnements/subscribe?userId=${userId}&competitionId=${competition.uuidId}`,
        { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      if (response.ok) {
        alert(`✅ ${userName}, abonné à "${competitionName}"`)
        loadAbonnements()
      } else {
        const error = await response.json().catch(() => ({ message: 'Erreur inconnue' }))
        alert(`❌ ${error.message || error.error || 'Échec de l\'abonnement'}`)
      }
    } catch (error: any) {
      alert(`❌ Erreur de connexion: ${error.message}`)
    }
  }

  // Se désabonner
  const handleSeDesabonner = async (competition: any, competitionName: string) => {
    if (!userId) return
    
    if (!confirm(`Voulez-vous vraiment vous désabonner de "${competitionName}" ?`)) {
      return
    }
    
    try {
      const response = await fetch(
        `http://localhost:8085/api/abonnements/unsubscribe?userId=${userId}&competitionId=${competition.uuidId}`,
        { method: 'DELETE' }
      )
      
      if (response.ok) {
        alert(`✅ ${userName}, désabonné de "${competitionName}"`)
        loadAbonnements()
      } else {
        const error = await response.json().catch(() => ({ message: 'Erreur inconnue' }))
        alert(`❌ ${error.message || error.error || 'Erreur lors du désabonnement'}`)
      }
    } catch (error: any) {
      alert(`❌ Erreur de connexion`)
    }
  }

  // Vérifier si abonné
  const estAbonne = (competition: any) => {
    return abonnements.has(competition.uuidId)
  }

  // Charger les abonnements
  useEffect(() => {
    if (userId) {
      loadAbonnements()
    }
  }, [userId])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Compétitions</h1>
        
        {/* Info utilisateur */}
        <div className="mt-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-700">
            <span className="font-medium">{userName}</span>
            <span className="mx-2">•</span>
            <span>ID: <span className="font-mono">{userId}</span></span>
          </div>
        </div>
        
        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-4 mt-4 mb-6">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{competitions.length}</div>
            <div className="text-sm text-gray-500">Compétitions</div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-2xl font-bold text-green-600">{abonnements.size}</div>
            <div className="text-sm text-gray-500">Abonnements</div>
          </div>
        </div>
      </div>

      {/* Liste des compétitions */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Chargement des compétitions...</p>
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">Aucune compétition disponible</p>
          </div>
        ) : (
          competitions.map((competition) => {
            const abonne = estAbonne(competition)
            
            return (
              <div key={competition.originalId} className="border p-4 rounded hover:shadow-md transition-shadow">
                <h3 className="font-bold text-lg mb-2">{competition.name}</h3>
                
                {/* Type de compétition */}
                {competition.type && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Type: </span>
                    <span className="font-medium bg-gray-100 px-2 py-1 rounded text-sm">
                      {competition.type}
                    </span>
                  </div>
                )}
                
                {/* Description */}
                {competition.description && (
                  <p className="text-gray-600 text-sm mb-3">{competition.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-sm ${abonne ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                      {abonne ? '✓ Abonné' : 'Non abonné'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (abonne) {
                        handleSeDesabonner(competition, competition.name)
                      } else {
                        handleSAbonner(competition, competition.name)
                      }
                    }}
                    className={`px-4 py-2 rounded ${abonne ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
                  >
                    {abonne ? 'Se désabonner' : 'S\'abonner'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}