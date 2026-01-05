"use client"
import React, { useEffect, useState } from 'react'
import eventsService from '@/src/api/eventsService'

export default function HomeEvents() {
  const [competitions, setCompetitions] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [epreuves, setEpreuves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [compsRes, eventsRes, epreuvesRes] = await Promise.all([
          eventsService.getCompetitions(),
          eventsService.getEvents(),
          eventsService.getEpreuves(),
        ])
        if (Array.isArray(compsRes)) setCompetitions(compsRes)
        if (Array.isArray(eventsRes)) setEvents(eventsRes)
        if (Array.isArray(epreuvesRes)) setEpreuves(epreuvesRes)
      } catch (e) {
        console.debug('HomeEvents load failed', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Compétitions, Événements & Épreuves</h2>
          <p className="text-muted-foreground">Consultez les compétitions, événements et épreuves à venir</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-4">Compétitions</h3>
          {loading ? (
            <p>Chargement...</p>
          ) : competitions.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune compétition trouvée.</p>
          ) : (
            <ul className="space-y-3">
              {competitions.slice(0, 8).map((c, i) => (
                <li key={c.id || i} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.name || c.nom || c.title}</div>
                    <div className="text-sm text-muted-foreground">{c.type || c.category || ''}</div>
                    {c.event && <div className="text-xs text-gray-400">Event: {c.event.name}</div>}
                  </div>
                  <div className="text-sm text-gray-500">{c.date || c.startTime || ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-4">Événements</h3>
          {loading ? (
            <p>Chargement...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun événement trouvé.</p>
          ) : (
            <ul className="space-y-3">
              {events.slice(0, 8).map((e, i) => (
                <li key={e.id || i} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{e.name || e.title}</div>
                    <div className="text-sm text-muted-foreground">{e.lieuPrincipal?.nom || e.venue || e.location || ''}</div>
                  </div>
                  <div className="text-sm text-gray-500">{e.date || e.time || ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold mb-4">Épreuves</h3>
          {loading ? (
            <p>Chargement...</p>
          ) : epreuves.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune épreuve trouvée.</p>
          ) : (
            <ul className="space-y-3">
              {epreuves.slice(0, 10).map((ep, i) => (
                <li key={ep.id || i} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{ep.nom || ep.name}</div>
                    <div className="text-sm text-muted-foreground">{ep.description || ''}</div>
                    {ep.competition && <div className="text-xs text-gray-400">Comp: {ep.competition.name || ep.competition.title}</div>}
                  </div>
                  <div className="text-sm text-gray-500">{ep.lieu?.nom || ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
