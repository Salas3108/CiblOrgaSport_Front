export interface Epreuve {
  id?: number;
  name: string;
  category?: string;
  maxParticipants?: number;
}

export interface Competition {
  id?: number;
  name: string;
  epreuves?: Epreuve[];
}

export interface Event {
  id?: number;
  name: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  competitions?: Competition[];
}
