import { useState, useCallback } from 'react';
import { mockApi } from '../services/mockApi';

export function useMockApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(apiCall: () => Promise<T>): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    api: mockApi,
    execute,
    isLoading,
    error,
  };
}
