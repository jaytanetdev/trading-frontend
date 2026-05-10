'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  watchlistService,
  WatchlistItem,
} from '@/lib/services/watchlist.service';

interface UseWatchlistResult {
  items: WatchlistItem[];
  symbols: string[];
  loading: boolean;
  error: string | null;
  isInWatchlist: (symbol: string) => boolean;
  add: (symbol: string) => Promise<void>;
  remove: (symbol: string) => Promise<void>;
  refetch: () => void;
}

export function useWatchlist(): UseWatchlistResult {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    watchlistService
      .getWatchlist()
      .then((result) => {
        if (!cancelled) {
          setItems(result);
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
  }, [trigger]);

  const symbols = items.map((i) => i.symbol);

  const isInWatchlist = useCallback(
    (symbol: string) => symbols.includes(symbol.toUpperCase()),
    [symbols],
  );

  const add = useCallback(async (symbol: string) => {
    const item = await watchlistService.addToWatchlist(symbol);
    setItems((prev) => {
      if (prev.some((i) => i.symbol === item.symbol)) return prev;
      return [item, ...prev];
    });
  }, []);

  const remove = useCallback(async (symbol: string) => {
    await watchlistService.removeFromWatchlist(symbol);
    const upper = symbol.toUpperCase();
    setItems((prev) => prev.filter((i) => i.symbol !== upper));
  }, []);

  const refetch = () => setTrigger((t) => t + 1);

  return { items, symbols, loading, error, isInWatchlist, add, remove, refetch };
}
