import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

export function useLoad(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(() => api.get(url).then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message)), [url]);
  useEffect(() => { load(); }, [load]);
  return { data, setData, reload: load, error };
}

export function useTitle(t) {
  useEffect(() => { document.title = t ? `${t} | Shyfunmi Nails` : 'Shyfunmi Nails | Nail Tech in Port Harcourt'; }, [t]);
}
