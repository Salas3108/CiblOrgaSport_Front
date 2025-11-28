import axiosInstance from './axios';
import { LoginRequest, RegisterRequest, JwtResponse } from '@/types';

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<JwtResponse> => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

register: async (userData: RegisterRequest): Promise<string> => {
  const response = await axiosInstance.post('/auth/register', userData);
  return response.data;
},

};