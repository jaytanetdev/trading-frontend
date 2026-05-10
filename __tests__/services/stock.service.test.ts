import axios from 'axios';
import { stockService } from '@/lib/services/stock.service';

// Mock the api-client module
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
    getOrCreateClientId: jest.fn(() => 'test-client-id'),
    CLIENT_ID_KEY: 'jtl.clientId',
  };
});

import apiClient from '@/lib/api-client';
const mockGet = apiClient.get as jest.Mock;

describe('stockService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── getStock ──────────────────────────────────────────────────────────

  describe('getStock', () => {
    it('calls /stock/:symbol and returns data', async () => {
      const mockData = {
        symbol: 'AAPL',
        candles: [],
        quote: { symbol: 'AAPL', price: 150 },
        analysis: null,
      };
      mockGet.mockResolvedValueOnce({ data: mockData });

      const result = await stockService.getStock('aapl');

      expect(mockGet).toHaveBeenCalledWith('/stock/AAPL');
      expect(result).toEqual(mockData);
    });

    it('uppercases the symbol in the URL', async () => {
      mockGet.mockResolvedValueOnce({ data: { symbol: 'NVDA' } });
      await stockService.getStock('nvda');
      expect(mockGet).toHaveBeenCalledWith('/stock/NVDA');
    });

    it('propagates errors from the API client', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network Error'));
      await expect(stockService.getStock('AAPL')).rejects.toThrow('Network Error');
    });
  });

  // ─── getOverview ───────────────────────────────────────────────────────

  describe('getOverview', () => {
    it('calls /stock/:symbol/overview', async () => {
      const mockOverview = { symbol: 'AAPL', name: 'Apple Inc.' };
      mockGet.mockResolvedValueOnce({ data: mockOverview });

      const result = await stockService.getOverview('AAPL');

      expect(mockGet).toHaveBeenCalledWith('/stock/AAPL/overview');
      expect(result).toEqual(mockOverview);
    });
  });

  // ─── getNews ──────────────────────────────────────────────────────────

  describe('getNews', () => {
    it('calls /stock/:symbol/news with limit param', async () => {
      const mockNews = [{ title: 'Test News', url: 'http://example.com' }];
      mockGet.mockResolvedValueOnce({ data: { items: mockNews } });

      const result = await stockService.getNews('AAPL', 5);

      expect(mockGet).toHaveBeenCalledWith('/stock/AAPL/news', { params: { limit: 5 } });
      expect(result).toEqual(mockNews);
    });

    it('defaults limit to 10', async () => {
      mockGet.mockResolvedValueOnce({ data: { items: [] } });
      await stockService.getNews('AAPL');
      expect(mockGet).toHaveBeenCalledWith('/stock/AAPL/news', { params: { limit: 10 } });
    });
  });

  // ─── search ───────────────────────────────────────────────────────────

  describe('search', () => {
    it('calls /search with q param and returns items', async () => {
      const mockResults = [
        { symbol: 'AAPL', name: 'Apple Inc.', region: 'NASDAQ', type: 'Equity' },
      ];
      mockGet.mockResolvedValueOnce({ data: { items: mockResults } });

      const result = await stockService.search('apple');

      expect(mockGet).toHaveBeenCalledWith('/search', { params: { q: 'apple' } });
      expect(result).toEqual(mockResults);
    });

    it('returns empty array when API returns no items', async () => {
      mockGet.mockResolvedValueOnce({ data: { items: [] } });
      const result = await stockService.search('xyz');
      expect(result).toEqual([]);
    });
  });

  // ─── getRecommendations ───────────────────────────────────────────────

  describe('getRecommendations', () => {
    it('calls /recommendations and returns items', async () => {
      const mockRecs = [
        { symbol: 'NVDA', price: 500, changePercent: 5, reason: 'Top gainer', category: 'TOP_GAINER' },
      ];
      mockGet.mockResolvedValueOnce({ data: { items: mockRecs } });

      const result = await stockService.getRecommendations();

      expect(mockGet).toHaveBeenCalledWith('/recommendations');
      expect(result).toEqual(mockRecs);
    });
  });
});
