import axiosInstance from './axios';
import { Event, Competition, Epreuve } from '@/types/event';

export const adminEventAPI = {
  getEvents: () =>
    axiosInstance.get<Event[]>('/admin/events'),

  createEvent: (data: Event) =>
    axiosInstance.post<Event>('/admin/events', data),

  deleteEvent: (id: number) =>
    axiosInstance.delete(`/admin/events/${id}`),

  addCompetition: (eventId: number, data: Competition) =>
    axiosInstance.post(`/admin/events/${eventId}/competitions`, data),

  addEpreuve: (competitionId: number, data: Epreuve) =>
    axiosInstance.post(`/admin/events/competitions/${competitionId}/epreuves`, data),
};
