'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PopularStock,
  PopularStocksParams,
  statsService,
} from '@/lib/services/stats.service';

interface UsePopularStocksResult {
  data: PopularStock[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePopularStocks(
  params: PopularStocksParams = {},
  autoRefreshMs?: number,
): UsePopularStocksResult {
  const [data, setData] = useState<PopularStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const from = params.from;
  const to = params.to;

  const fetchData = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    statsService
      .getPopularStocks({ from, to })
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [from, to]);

  useEffect(() => {
    const cleanup = fetchData();
    return cleanup;
    // trigger is intentionally included to allow manual refetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, trigger]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefreshMs) return;
    const interval = setInterval(() => {
      setTrigger((t) => t + 1);
    }, autoRefreshMs);
    return () => clearInterval(interval);
  }, [autoRefreshMs]);

  const refetch = () => setTrigger((t) => t + 1);

  return { data, loading, error, refetch };
}
