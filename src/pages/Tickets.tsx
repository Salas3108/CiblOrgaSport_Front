import { useEffect, useState } from 'react';
import { listTickets, getTicketPrice } from '../api/ticketService';

export default function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [price, setPrice] = useState<any>(null);

  useEffect(() => {
    listTickets().then((data) => setTickets(Array.isArray(data) ? data : (data?.content ?? [])));
    getTicketPrice({ type: 'standard' }).then(setPrice);
  }, []);

  return (
    <div>
      <h2>Tickets</h2>
      <p>Example price: {JSON.stringify(price)}</p>
      <ul>
        {tickets.map((t) => (
          <li key={t.id}>{t.name ?? t.id}</li>
        ))}
      </ul>
    </div>
  );
}
