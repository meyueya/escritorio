import { useState, useCallback } from 'react';
import { createApiClient } from '../api/client';

export const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const api = await createApiClient();
      const data = await api.get('/api/jobs');
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateJobStatus = useCallback(async (id, updates) => {
    try {
      const api = await createApiClient();
      const updated = await api.put(`/api/jobs/${id}`, updates);
      setJobs(prev => prev.map(j => j.id === id ? updated : j));
      return updated;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteJob = useCallback(async (id) => {
    try {
      const api = await createApiClient();
      await api.delete(`/api/jobs/${id}`);
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (err) {
      throw err;
    }
  }, []);

  const importJobUrl = useCallback(async (url) => {
    const api = await createApiClient();
    const enriched = await api.post('/api/jobs', { url });
    setJobs(prev => [enriched, ...prev]);
    return enriched;
  }, []);

  const reanalyzeJob = useCallback(async (id) => {
    const api = await createApiClient();
    const updated = await api.post(`/api/jobs/${id}/reanalyze`);
    setJobs(prev => prev.map(j => j.id === id ? updated : j));
    return updated;
  }, []);

  const sendApplication = useCallback(async (id, coverLetter, cvTailored) => {
    const api = await createApiClient();
    const result = await api.post(`/api/jobs/${id}/send`, { coverLetter, cvTailored });
    setJobs(prev => prev.map(j => j.id === id ? result.job : j));
    return result;
  }, []);

  const clearAll = useCallback(async () => {
    const api = await createApiClient();
    await api.post('/api/jobs/clear');
    setJobs([]);
  }, []);

  // Estadísticas del pipeline
  const stats = {
    total: jobs.length,
    newMatches: jobs.filter(j => j.status === 'Found').length,
    pending: jobs.filter(j => j.status === 'Needs Approval').length,
    applied: jobs.filter(j => j.status === 'Applied').length,
    interviewing: jobs.filter(j => j.status === 'Interviewing').length,
  };

  return { jobs, loading, error, stats, fetchJobs, updateJobStatus, deleteJob, importJobUrl, reanalyzeJob, sendApplication, clearAll };
};
