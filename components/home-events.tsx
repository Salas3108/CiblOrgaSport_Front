"use client"
import React, { useEffect, useState } from 'react'
import { getMe } from '@/src/api/authService'
import { getUserSubscriptions, subscribeToCompetition, unsubscribeFromCompetition } from '@/src/api/abonnementService'
import { listCompetitions } from '@/src/api/eventService'

type CompetitionItem = {
  id: number
  name?: string
  dateDebut?: string
  dateFin?: string
  type?: string
  description?: string
  paysHote?: string
  [key: string]: any
}

const toNumber = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

const parseStoredUser = () => {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const formatDateFr = (value?: string) => {
  if (!value) return 'Non renseignee'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const formatDateRange = (dateDebut?: string, dateFin?: string) => {
  if (dateDebut && dateFin) {
    return `${formatDateFr(dateDebut)} - ${formatDateFr(dateFin)}`
  }
  if (dateDebut) {
    return `A partir du ${formatDateFr(dateDebut)}`
  }
  if (dateFin) {
    return `Jusqu'au ${formatDateFr(dateFin)}`
  }
  return 'Non renseignee'
}

export default function HomeEvents() {
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([])
  const [abonnements, setAbonnements] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<number | null>(null)
  const [userName, setUserName] = useState<string>('Utilisateur')

  const resolveConnectedUser = async (): Promise<{ id: number | null; name: string }> => {
    const storedUser = parseStoredUser()
    const storedId = toNumber(storedUser?.id)
    const storedName = storedUser?.name || storedUser?.username || storedUser?.email || 'Utilisateur'

    if (storedId !== null) {
      return { id: storedId, name: storedName }
    }

    try {
      const me = await getMe()
      const meId = toNumber((me as any)?.id)
      const meName = (me as any)?.username || (me as any)?.name || (me as any)?.email || storedName

      if (meId !== null && typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify({ ...(storedUser || {}), ...(me || {}), id: meId }))
      }

      return { id: meId, name: meName || 'Utilisateur' }
    } catch {
      return { id: null, name: storedName }
    }
  }

  useEffect(() => {
    let isMounted = true

    const initUser = async () => {
      const connectedUser = await resolveConnectedUser()
      if (!isMounted) return
      setUserId(connectedUser.id)
      setUserName(connectedUser.name)
    }

    initUser()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const loadCompetitions = async () => {
      try {
        setLoading(true)
        const data = await listCompetitions()
        const normalized = Array.isArray(data)
          ? data
              .map((comp: any) => {
                const compId = toNumber(comp?.id)
                if (compId === null) return null
                return {
                  ...comp,
                  id: compId,
                } as CompetitionItem
              })
              .filter((comp: CompetitionItem | null): comp is CompetitionItem => comp !== null)
          : []

        setCompetitions(normalized)
      } catch (error) {
        console.error('Erreur chargement compétitions:', error)
        setCompetitions([])
      } finally {
        setLoading(false)
      }
    }

    loadCompetitions()
  }, [])

  const loadAbonnements = async (currentUserId: number) => {
    try {
      const data = await getUserSubscriptions(currentUserId)
      const competitionIds = Array.isArray(data)
        ? data
            .map((ab: any) => toNumber(ab?.competitionId))
            .filter((id: number | null): id is number => id !== null)
        : []
      setAbonnements(new Set(competitionIds))
    } catch (error) {
      console.warn('Impossible de charger les abonnements:', error)
      setAbonnements(new Set())
    }
  }

  useEffect(() => {
    if (userId === null) {
      setAbonnements(new Set())
      return
    }
    loadAbonnements(userId)
  }, [userId])

  const handleSAbonner = async (competition: CompetitionItem, competitionName: string) => {
    if (userId === null) {
      alert('Veuillez vous connecter')
      return
    }

    const competitionId = toNumber(competition?.id)
    if (competitionId === null) {
      alert('Compétition invalide')
      return
    }

    try {
      await subscribeToCompetition(userId, competitionId)
      alert(`✅ ${userName}, abonné à "${competitionName}"`)
      await loadAbonnements(userId)
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Échec de l\'abonnement'
      alert(`❌ ${message}`)
    }
  }

  const handleSeDesabonner = async (competition: CompetitionItem, competitionName: string) => {
    if (userId === null) return

    const competitionId = toNumber(competition?.id)
    if (competitionId === null) {
      alert('Compétition invalide')
      return
    }

    if (!confirm(`Voulez-vous vraiment vous désabonner de "${competitionName}" ?`)) {
      return
    }

    try {
      await unsubscribeFromCompetition(userId, competitionId)
      alert(`✅ ${userName}, désabonné de "${competitionName}"`)
      await loadAbonnements(userId)
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erreur lors du désabonnement'
      alert(`❌ ${message}`)
    }
  }

  const estAbonne = (competition: CompetitionItem) => {
    return abonnements.has(Number(competition.id))
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Compétitions</h1>
        
        {/* Info utilisateur */}
        <div className="mt-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-gray-700">
            <span className="font-medium">{userName}</span>
            <span className="mx-2">•</span>
            <span>ID: <span className="font-mono">{userId ?? '-'}</span></span>
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
              <div key={competition.id} className="border p-4 rounded hover:shadow-md transition-shadow">
                <h3 className="font-bold text-lg mb-2">
                  {competition.name || `Competition #${competition.id}`}
                </h3>

                <div className="grid gap-2 text-sm text-gray-700 mb-3">
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <span>
                      <span className="font-medium">ID: </span>
                      <span className="font-mono">{competition.id}</span>
                    </span>
                    <span>
                      <span className="font-medium">Periode: </span>
                      {formatDateRange(competition.dateDebut, competition.dateFin)}
                    </span>
                  </div>

                  {competition.paysHote && (
                    <div>
                      <span className="font-medium">Pays hote: </span>
                      {competition.paysHote}
                    </div>
                  )}
                </div>
                
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
                <div className="text-gray-600 text-sm mb-3 bg-gray-50 rounded-md p-3">
                  <span className="font-medium text-gray-700">Description: </span>
                  {competition.description || 'Aucune description fournie.'}
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-sm ${abonne ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                      {abonne ? '✓ Abonné' : 'Non abonné'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (abonne) {
                        handleSeDesabonner(competition, competition.name || 'cette compétition')
                      } else {
                        handleSAbonner(competition, competition.name || 'cette compétition')
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