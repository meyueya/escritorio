import { useState, useCallback } from 'react';
import { createApiClient } from '../api/client';

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = await createApiClient();
      const data = await api.get('/api/profile');
      setProfile(data);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveProfile = useCallback(async (profileData) => {
    const api = await createApiClient();
    const updated = await api.post('/api/profile', profileData);
    setProfile(updated);
    return updated;
  }, []);

  return { profile, loading, error, fetchProfile, saveProfile };
};
