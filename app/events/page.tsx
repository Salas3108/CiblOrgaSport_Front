"use client"

import React, { useEffect, useState, useMemo } from 'react'
import eventsService from '@/src/api/eventsService'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Trophy,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

/* =======================
   Helpers date / heure
======================= */
const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString('fr-FR') : ''

const formatTime = (time?: string) =>
  time ? time.slice(0, 5) : ''

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [competitions, setCompetitions] = useState<any[]>([])
  const [epreuves, setEpreuves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'events' | 'competitions' | 'epreuves'>('events')
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set())

  const competitionsByEvent = useMemo(() => {
    const grouped: Record<number, any[]> = {}
    competitions.forEach(comp => {
      const eventId = comp.event?.id || comp.eventId || comp.event_id
      if (eventId) {
        if (!grouped[eventId]) grouped[eventId] = []
        grouped[eventId].push(comp)
      }
    })
    return grouped
  }, [competitions])

  const toggleEventExpanded = (eventId: number) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev)
      newSet.has(eventId) ? newSet.delete(eventId) : newSet.add(eventId)
      return newSet
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [eventsData, competitionsData, epreuvesData] = await Promise.all([
        eventsService.getEvents().catch(() => []),
        eventsService.getCompetitions().catch(() => []),
        eventsService.getEpreuves().catch(() => [])
      ])
      setEvents(eventsData || [])
      setCompetitions(competitionsData || [])
      setEpreuves(epreuvesData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Supprimer cet événement ?')) return
    await eventsService.deleteEvent(id)
    setEvents(events.filter(e => e.id !== id))
  }

  const handleDeleteCompetition = async (id: number) => {
    if (!confirm('Supprimer cette compétition ?')) return
    await eventsService.deleteCompetition(id)
    setCompetitions(competitions.filter(c => c.id !== id))
  }

  const handleDeleteEpreuve = async (id: number) => {
    if (!confirm('Supprimer cette épreuve ?')) return
    await eventsService.deleteEpreuve(id)
    setEpreuves(epreuves.filter(e => e.id !== id))
  }

  if (loading) {
    return (
      <main className="container mx-auto py-8 flex justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </main>
    )
  }

  if (error) {
    return (
      <main className="container mx-auto py-8">
        <AlertCircle /> {error}
      </main>
    )
  }

  return (
    <main className="container mx-auto py-8">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        {['events', 'competitions', 'epreuves'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 ${
              activeTab === tab ? 'border-b-2 border-primary' : 'text-muted-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* =======================
           EPREUVES
      ======================= */}
      {activeTab === 'epreuves' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {epreuves.map(epreuve => (
            <Card key={epreuve.id}>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>{epreuve.nom}</CardTitle>
                  <Badge variant="outline">#{epreuve.id}</Badge>
                </div>

                <CardDescription className="mt-3 space-y-2">
                  {epreuve.description}

                  {/* 📅 Date + heures */}
                  {epreuve.date && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(epreuve.date)}
                        {epreuve.heureDebut && epreuve.heureFin && (
                          <> — {formatTime(epreuve.heureDebut)} → {formatTime(epreuve.heureFin)}</>
                        )}
                      </span>
                    </div>
                  )}

                  {/* 📍 Lieu */}
                  {epreuve.lieu && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{epreuve.lieu.nom}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Détails
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteEpreuve(epreuve.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
