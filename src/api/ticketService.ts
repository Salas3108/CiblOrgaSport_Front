import { http, apiBases } from './httpClient';

const base = apiBases.billetterie;

export const listTickets = (params?: Record<string, any>) =>
  http.get(`${base}/api/tickets`, { params }).then((r) => r.data);

export const getTicket = (id: string | number) =>
  http.get(`${base}/api/tickets/${encodeURIComponent(String(id))}`).then((r) => r.data);

export const createTicket = (payload: any) =>
  http.post(`${base}/api/tickets`, payload).then((r) => r.data);

export const updateTicket = (id: string | number, payload: any) =>
  http.put(`${base}/api/tickets/${encodeURIComponent(String(id))}`, payload).then((r) => r.data);

export const deleteTicket = (id: string | number) =>
  http.delete(`${base}/api/tickets/${encodeURIComponent(String(id))}`).then((r) => r.data);

export const getTicketPrice = (query?: Record<string, any>) =>
  http.get(`${base}/api/tickets/price`, { params: query }).then((r) => r.data);
