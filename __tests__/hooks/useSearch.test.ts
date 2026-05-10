import { renderHook, act, waitFor } from '@testing-library/react';
import { useSearch } from '@/hooks/useSearch';

jest.mock('@/lib/services/stock.service', () => ({
  stockService: {
    search: jest.fn(),
  },
}));

import { stockService } from '@/lib/services/stock.service';
const mockSearch = stockService.search as jest.Mock;

describe('useSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns empty results when query is empty', () => {
    const { result } = renderHook(() => useSearch(''));
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('debounces search calls', async () => {
    mockSearch.mockResolvedValue([{ symbol: 'AAPL', name: 'Apple' }]);

    const { result } = renderHook(() => useSearch('apple'));

    // Before debounce fires
    expect(mockSearch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledTimes(1);
      expect(mockSearch).toHaveBeenCalledWith('apple');
    });
  });

  it('sets loading to true while fetching', async () => {
    let resolveSearch!: (val: unknown) => void;
    mockSearch.mockImplementationOnce(
      () => new Promise((res) => { resolveSearch = res; }),
    );

    const { result } = renderHook(() => useSearch('test', 0));

    act(() => {
      jest.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    act(() => {
      resolveSearch([]);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('handles errors gracefully', async () => {
    mockSearch.mockRejectedValueOnce(new Error('Search failed'));

    const { result } = renderHook(() => useSearch('error-query', 0));

    act(() => {
      jest.advanceTimersByTime(10);
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Search failed');
      expect(result.current.results).toEqual([]);
    });
  });
});
