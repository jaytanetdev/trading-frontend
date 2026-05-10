'use client';

import { useEffect, useState } from 'react';
import { stockService, StockResponse } from '@/lib/services/stock.service';

interface UseStockResult {
  data: StockResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStock(symbol: string | null): UseStockResult {
  const [data, setData] = useState<StockResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    if (!symbol) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    stockService
      .getStock(symbol)
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
  }, [symbol, trigger]);

  const refetch = () => setTrigger((t) => t + 1);

  return { data, loading, error, refetch };
}
