const GATEWAY = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://137.74.133.131';

export async function getUserTickets() {
  const token = localStorage.getItem('token');
  const res = await fetch(`${GATEWAY}/billetterie/api/tickets`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data?.message || text);
    return data;
  } catch (e) {
    if (!res.ok) throw new Error(text || 'Erreur tickets');
    return text;
  }
}

export async function createTicket(payload: any) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${GATEWAY}/billetterie/api/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data?.message || text);
    return data;
  } catch (e) {
    if (!res.ok) throw new Error(text || 'Erreur création ticket');
    return text;
  }
}

export default {
  getUserTickets,
  createTicket,
};
