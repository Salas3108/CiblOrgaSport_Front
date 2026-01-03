import { useState } from 'react';
import { login, persistToken } from '../api/authService';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doLogin = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await login({ username, password });
      // Expecting res to contain token
      persistToken(res?.token);
      return res;
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { doLogin, loading, error };
}
