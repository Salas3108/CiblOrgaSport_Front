"use client"

import React, { useEffect, useState } from 'react'
import eventsService from '@/src/api/eventsService'
import Link from 'next/link'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    eventsService
      .getEvents()
      .then((res) => {
        if (!mounted) return
        if (Array.isArray(res)) setEvents(res)
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Events</h1>

      {loading ? (
        <p>Loading...</p>
      ) : events.length === 0 ? (
        <p>No events found.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id || e._id}>
              <Link href={`/events/${e.id || e._id}`}>
                <span className="text-blue-600 underline">{e.name || e.title || e.label || 'Event'}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
