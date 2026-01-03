import { useEffect, useState } from 'react';
import { adminListEvents, adminCreateEvent, adminDeleteEvent } from '../api/eventService';

export default function AdminEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await adminListEvents();
      setEvents(data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    await adminCreateEvent({ /* minimal payload */ });
    await refresh();
  };

  const remove = async (id: number) => {
    await adminDeleteEvent(id);
    await refresh();
  };

  return (
    <div>
      <h2>Admin Events</h2>
      <button onClick={create} disabled={loading}>Create</button>
      {loading ? <p>Loading...</p> : (
        <ul>
          {events.map((e) => (
            <li key={e.id}>
              {e.name ?? e.id}
              <button onClick={() => remove(e.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
