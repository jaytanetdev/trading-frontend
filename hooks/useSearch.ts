'use client';

import { useEffect, useState } from 'react';
import { SearchResult, stockService } from '@/lib/services/stock.service';

interface UseSearchResult {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
}

export function useSearch(
  query: string,
  debounceMs = 250,
): UseSearchResult {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);

      stockService
        .search(query.trim())
        .then((items) => {
          if (!cancelled) {
            setResults(items);
            setLoading(false);
          }
        })
        .catch((err: Error) => {
          if (!cancelled) {
            setError(err.message);
            setResults([]);
            setLoading(false);
          }
        });
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, debounceMs]);

  return { results, loading, error };
}
