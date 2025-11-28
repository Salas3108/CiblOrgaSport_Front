export enum Role {
  USER = 'USER',
  ATHLETE = 'ATHLETE',
  ADMIN = 'ADMIN',
  COMMISSAIRE = 'COMMISSAIRE',
  VOLONTAIRE = 'VOLONTAIRE',
  SPECTATEUR = 'SPECTATEUR'
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  documents: string[];
  validated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: Role;
}

export interface JwtResponse {
  token: string;
  type: string;
  username: string;
  email: string;
  role: string;
}