"use client"
import React, { useEffect, useState } from 'react'
import eventsService from '@/src/api/eventsService'

export default function HomeEvents() {
  const [competitions, setCompetitions] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [compsRes, eventsRes] = await Promise.all([
          eventsService.getCompetitions(),
          eventsService.getEvents(),
        ])
        if (Array.isArray(compsRes)) setCompetitions(compsRes)
        if (Array.isArray(eventsRes)) setEvents(eventsRes)
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
          <h2 className="text-3xl font-bold">Compétitions & Événements</h2>
          <p className="text-muted-foreground">Consultez les compétitions et événements à venir</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <div className="font-medium">{c.name || c.title}</div>
                    <div className="text-sm text-muted-foreground">{c.type || c.category || ''}</div>
                  </div>
                  <div className="text-sm text-gray-500">{c.startTime || c.date || ''}</div>
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
                    <div className="text-sm text-muted-foreground">{e.venue || e.location || ''}</div>
                  </div>
                  <div className="text-sm text-gray-500">{e.time || e.date || ''}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
