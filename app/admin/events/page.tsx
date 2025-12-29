'use client';

import { useEffect, useState } from 'react';
import { adminEventAPI } from '@/lib/api/adminEvents';
import { Event } from '@/types/event';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const res = await adminEventAPI.getEvents();
    setEvents(res.data);
  };

  const createEvent = async () => {
    await adminEventAPI.createEvent({ name });
    setName('');
    loadEvents();
  };

  const deleteEvent = async (id: number) => {
    await adminEventAPI.deleteEvent(id);
    loadEvents();
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Gestion des événements</h1>

      <input
        placeholder="Nom événement"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <button onClick={createEvent}>Créer</button>

      <ul>
        {events.map(e => (
          <li key={e.id}>
            {e.name}
            <button onClick={() => deleteEvent(e.id!)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
