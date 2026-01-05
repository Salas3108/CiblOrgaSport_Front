"use client"

import React, { useEffect, useState, useMemo } from 'react'
import eventsService from '@/src/api/eventsService'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Loader2, AlertCircle, Plus, Trash2, Trophy, ChevronDown, ChevronUp } from 'lucide-react'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [competitions, setCompetitions] = useState<any[]>([])
  const [epreuves, setEpreuves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'events' | 'competitions' | 'epreuves'>('events')
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set())

  // Grouper les compétitions par événement
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
      if (newSet.has(eventId)) {
        newSet.delete(eventId)
      } else {
        newSet.add(eventId)
      }
      return newSet
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [eventsData, competitionsData, epreuvesData] = await Promise.all([
        eventsService.getEvents().catch(() => []),
        eventsService.getCompetitions().catch(() => []),
        eventsService.getEpreuves().catch(() => [])
      ])
      
      console.log('Events loaded:', eventsData)
      console.log('Competitions loaded:', competitionsData)
      console.log('Epreuves loaded:', epreuvesData)
      
      setEvents(Array.isArray(eventsData) ? eventsData : [])
      setCompetitions(Array.isArray(competitionsData) ? competitionsData : [])
      setEpreuves(Array.isArray(epreuvesData) ? epreuvesData : [])
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return
    try {
      await eventsService.deleteEvent(id)
      setEvents(events.filter(e => e.id !== id))
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  const handleDeleteCompetition = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette compétition ?')) return
    try {
      await eventsService.deleteCompetition(id)
      setCompetitions(competitions.filter(c => c.id !== id))
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  const handleDeleteEpreuve = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette épreuve ?')) return
    try {
      await eventsService.deleteEpreuve(id)
      setEpreuves(epreuves.filter(e => e.id !== id))
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    }
  }

  if (loading) {
    return (
      <main className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container mx-auto py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Erreur</h3>
            </div>
            <p>{error}</p>
            <Button onClick={loadData} className="mt-4">Réessayer</Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Gestion des Événements</h1>
        <p className="text-muted-foreground">
          Gérez les événements, compétitions et épreuves sportives
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'events'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Événements ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('competitions')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'competitions'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Compétitions ({competitions.length})
        </button>
        <button
          onClick={() => setActiveTab('epreuves')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'epreuves'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Épreuves ({epreuves.length})
        </button>
      </div>

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel événement
            </Button>
          </div>

          {events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucun événement</p>
                <p className="text-muted-foreground">Créez votre premier événement</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const eventCompetitions = competitionsByEvent[event.id] || []
                const isExpanded = expandedEvents.has(event.id)
                
                return (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-xl">{event.name}</CardTitle>
                            <Badge variant="outline">#{event.id}</Badge>
                            {eventCompetitions.length > 0 && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Trophy className="h-3 w-3" />
                                {eventCompetitions.length} compétition{eventCompetitions.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                            </div>
                            {event.lieuPrincipal && (
                              <div className="flex items-center gap-2 mt-1">
                                <MapPin className="h-4 w-4" />
                                <span>{event.lieuPrincipal.nom}</span>
                              </div>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/events/${event.id}`}>
                            <Button variant="outline" size="sm">
                              Détails
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {eventCompetitions.length > 0 && (
                      <CardContent>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEventExpanded(event.id)}
                          className="w-full flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            {isExpanded ? 'Masquer' : 'Afficher'} les compétitions ({eventCompetitions.length})
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {isExpanded && (
                          <div className="mt-4 space-y-3 pl-4 border-l-2 border-primary/20">
                            {eventCompetitions.map((comp) => (
                              <div
                                key={comp.id}
                                className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{comp.name}</h4>
                                      <Badge variant="outline" className="text-xs">#{comp.id}</Badge>
                                      {comp.type && (
                                        <Badge variant="secondary" className="text-xs">{comp.type}</Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span>{new Date(comp.date).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="sm">
                                      Voir
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteCompetition(comp.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                    </Card>

                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Competitions Tab */}
      {activeTab === 'competitions' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle compétition
            </Button>
          </div>

          {competitions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucune compétition</p>
                <p className="text-muted-foreground">Créez votre première compétition</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {competitions.map((comp) => (
                <Card key={comp.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-2">{comp.name}</CardTitle>
                      <Badge variant="outline">#{comp.id}</Badge>
                    </div>
                    <CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(comp.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {comp.type && (
                        <Badge variant="secondary" className="mt-2">{comp.type}</Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" size="sm">
                        Détails
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCompetition(comp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Epreuves Tab */}
      {activeTab === 'epreuves' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle épreuve
            </Button>
          </div>

          {epreuves.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucune épreuve</p>
                <p className="text-muted-foreground">Créez votre première épreuve</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {epreuves.map((epreuve) => (
                <Card key={epreuve.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-2">{epreuve.nom}</CardTitle>
                      <Badge variant="outline">#{epreuve.id}</Badge>
                    </div>
                    <CardDescription className="line-clamp-2 mt-2">
                      {epreuve.description}
                      {epreuve.lieu && (
                        <div className="flex items-center gap-2 mt-2">
                          <MapPin className="h-4 w-4" />
                          <span>{epreuve.lieu.nom}</span>
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" size="sm">
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
        </div>
      )}
    </main>
  )
}
