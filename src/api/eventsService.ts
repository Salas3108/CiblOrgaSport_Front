const GATEWAY = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function getCompetitions() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${GATEWAY}/event/competitions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data?.message || text);
    return data;
  } catch (e) {
    if (!res.ok) throw new Error(text || 'Erreur competitions');
    return text;
  }
}

export async function getEvents() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${GATEWAY}/event/events`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data?.message || text);
    return data;
  } catch (e) {
    if (!res.ok) throw new Error(text || 'Erreur events');
    return text;
  }
}

export default { getCompetitions, getEvents };
