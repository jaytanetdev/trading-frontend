jest.mock('@/lib/api-client', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
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
import { statsService } from '@/lib/services/stats.service';

const mockGet = apiClient.get as jest.Mock;

describe('statsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPopularStocks', () => {
    it('calls GET /stats/popular with no params by default', async () => {
      mockGet.mockResolvedValueOnce({ data: { items: [] } });

      await statsService.getPopularStocks();

      expect(mockGet).toHaveBeenCalledWith('/stats/popular', { params: {} });
    });

    it('passes from/to date params', async () => {
      const mockItems = [
        { symbol: 'NVDA', addCount: 10, removeCount: 2, netCount: 8 },
      ];
      mockGet.mockResolvedValueOnce({ data: { items: mockItems } });

      const result = await statsService.getPopularStocks({
        from: '2024-01-01',
        to: '2024-12-31',
      });

      expect(mockGet).toHaveBeenCalledWith('/stats/popular', {
        params: { from: '2024-01-01', to: '2024-12-31' },
      });
      expect(result).toEqual(mockItems);
    });

    it('returns empty array when no popular stocks', async () => {
      mockGet.mockResolvedValueOnce({ data: { items: [] } });

      const result = await statsService.getPopularStocks({ from: '2024-01-01' });
      expect(result).toEqual([]);
    });

    it('propagates API errors', async () => {
      mockGet.mockRejectedValueOnce(new Error('API unavailable'));

      await expect(statsService.getPopularStocks()).rejects.toThrow('API unavailable');
    });
  });
});
