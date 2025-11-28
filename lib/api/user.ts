import axiosInstance from './axios';
import { User } from '@/types';

export const userAPI = {
  uploadDocuments: async (documents: string[]): Promise<{ user: User; validated: boolean }> => {
    const response = await axiosInstance.post('/user/upload-documents', documents);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get('/user/profile');
    return response.data;
  },
};