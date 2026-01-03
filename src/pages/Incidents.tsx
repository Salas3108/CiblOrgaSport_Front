import { useEffect, useState } from 'react';
import { listIncidents, createIncident } from '../api/incidentService';

export default function Incidents() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await listIncidents();
      setIncidents(Array.isArray(data) ? data : (data?.content ?? [])); // handle pagination
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    await createIncident({ /* minimal payload */ });
    await refresh();
  };

  return (
    <div>
      <h2>Incidents</h2>
      <button onClick={create} disabled={loading}>Create Incident</button>
      {loading ? <p>Loading...</p> : (
        <ul>
          {incidents.map((i) => (
            <li key={i.id}>{i.title ?? i.id}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
