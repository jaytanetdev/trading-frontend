import { renderHook, act, waitFor } from '@testing-library/react';
import { useWatchlist } from '@/hooks/useWatchlist';

jest.mock('@/lib/services/watchlist.service', () => ({
  watchlistService: {
    getWatchlist: jest.fn(),
    addToWatchlist: jest.fn(),
    removeFromWatchlist: jest.fn(),
  },
}));

import { watchlistService } from '@/lib/services/watchlist.service';
const mockGetWatchlist = watchlistService.getWatchlist as jest.Mock;
const mockAdd = watchlistService.addToWatchlist as jest.Mock;
const mockRemove = watchlistService.removeFromWatchlist as jest.Mock;

describe('useWatchlist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches watchlist on mount', async () => {
    const items = [
      { id: 1, clientId: 'c1', symbol: 'AAPL', addedAt: '2024-01-01' },
    ];
    mockGetWatchlist.mockResolvedValueOnce(items);

    const { result } = renderHook(() => useWatchlist());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.items).toEqual(items);
    });
  });

  it('exposes symbols as a string array', async () => {
    mockGetWatchlist.mockResolvedValueOnce([
      { id: 1, clientId: 'c1', symbol: 'AAPL', addedAt: '2024-01-01' },
      { id: 2, clientId: 'c1', symbol: 'NVDA', addedAt: '2024-01-02' },
    ]);

    const { result } = renderHook(() => useWatchlist());

    await waitFor(() => {
      expect(result.current.symbols).toEqual(['AAPL', 'NVDA']);
    });
  });

  it('isInWatchlist returns correct boolean', async () => {
    mockGetWatchlist.mockResolvedValueOnce([
      { id: 1, clientId: 'c1', symbol: 'AAPL', addedAt: '2024-01-01' },
    ]);

    const { result } = renderHook(() => useWatchlist());

    await waitFor(() => {
      expect(result.current.isInWatchlist('AAPL')).toBe(true);
      expect(result.current.isInWatchlist('aapl')).toBe(true);
      expect(result.current.isInWatchlist('NVDA')).toBe(false);
    });
  });

  it('add optimistically updates the list', async () => {
    mockGetWatchlist.mockResolvedValueOnce([]);
    const newItem = { id: 2, clientId: 'c1', symbol: 'TSLA', addedAt: '2024-01-03' };
    mockAdd.mockResolvedValueOnce(newItem);

    const { result } = renderHook(() => useWatchlist());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.add('TSLA');
    });

    expect(result.current.symbols).toContain('TSLA');
    expect(mockAdd).toHaveBeenCalledWith('TSLA');
  });

  it('remove removes item from local state', async () => {
    mockGetWatchlist.mockResolvedValueOnce([
      { id: 1, clientId: 'c1', symbol: 'AAPL', addedAt: '2024-01-01' },
      { id: 2, clientId: 'c1', symbol: 'NVDA', addedAt: '2024-01-02' },
    ]);
    mockRemove.mockResolvedValueOnce({ message: 'AAPL removed from watchlist' });

    const { result } = renderHook(() => useWatchlist());

    await waitFor(() => expect(result.current.items).toHaveLength(2));

    await act(async () => {
      await result.current.remove('AAPL');
    });

    expect(result.current.symbols).not.toContain('AAPL');
    expect(result.current.symbols).toContain('NVDA');
  });

  it('handles fetch error gracefully', async () => {
    mockGetWatchlist.mockRejectedValueOnce(new Error('API error'));

    const { result } = renderHook(() => useWatchlist());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('API error');
      expect(result.current.items).toEqual([]);
    });
  });
});
