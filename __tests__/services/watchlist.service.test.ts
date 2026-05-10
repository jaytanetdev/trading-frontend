jest.mock('@/lib/api-client', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: mockAxiosInstance,
    getOrCreateClientId: jest.fn(() => 'test-client-uuid'),
    CLIENT_ID_KEY: 'jtl.clientId',
  };
});

import apiClient from '@/lib/api-client';
import { watchlistService } from '@/lib/services/watchlist.service';

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

describe('watchlistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getWatchlist ──────────────────────────────────────────────────────

  describe('getWatchlist', () => {
    it('calls GET /watchlist/:clientId and returns items', async () => {
      const mockItems = [
        { id: 1, clientId: 'test-client-uuid', symbol: 'AAPL', addedAt: '2024-01-01' },
      ];
      mockGet.mockResolvedValueOnce({ data: { items: mockItems } });

      const result = await watchlistService.getWatchlist();

      expect(mockGet).toHaveBeenCalledWith('/watchlist/test-client-uuid');
      expect(result).toEqual(mockItems);
    });

    it('returns empty array when clientId is unavailable (SSR)', async () => {
      const { getOrCreateClientId } = require('@/lib/api-client');
      (getOrCreateClientId as jest.Mock).mockReturnValueOnce('');

      const result = await watchlistService.getWatchlist();
      expect(result).toEqual([]);
      expect(mockGet).not.toHaveBeenCalled();
    });
  });

  // ─── addToWatchlist ────────────────────────────────────────────────────

  describe('addToWatchlist', () => {
    it('calls POST /watchlist/:clientId/:symbol with uppercase symbol', async () => {
      const mockItem = { id: 1, clientId: 'test-client-uuid', symbol: 'AAPL', addedAt: '2024-01-01' };
      mockPost.mockResolvedValueOnce({ data: mockItem });

      const result = await watchlistService.addToWatchlist('aapl');

      expect(mockPost).toHaveBeenCalledWith('/watchlist/test-client-uuid/AAPL');
      expect(result).toEqual(mockItem);
    });
  });

  // ─── removeFromWatchlist ───────────────────────────────────────────────

  describe('removeFromWatchlist', () => {
    it('calls DELETE /watchlist/:clientId/:symbol', async () => {
      mockDelete.mockResolvedValueOnce({ data: { message: 'NVDA removed from watchlist' } });

      const result = await watchlistService.removeFromWatchlist('nvda');

      expect(mockDelete).toHaveBeenCalledWith('/watchlist/test-client-uuid/NVDA');
      expect(result).toEqual({ message: 'NVDA removed from watchlist' });
    });
  });
});
