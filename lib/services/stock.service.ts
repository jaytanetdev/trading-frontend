import apiClient from '../api-client';
import type {
  Candle,
  CompanyOverview,
  Quote,
  Recommendation,
  StockAnalysis,
} from '@/types/stock';
import type { NewsItem } from '@/lib/yahoo-finance';

export interface StockResponse {
  symbol: string;
  candles: Candle[];
  quote: Quote;
  analysis: StockAnalysis | null;
}

export interface SearchResult {
  symbol: string;
  name: string;
  region: string;
  type: string;
}

export const stockService = {
  async getStock(symbol: string): Promise<StockResponse> {
    const { data } = await apiClient.get<StockResponse>(
      `/stock/${encodeURIComponent(symbol.toUpperCase())}`,
    );
    return data;
  },

  async getOverview(symbol: string): Promise<CompanyOverview> {
    const { data } = await apiClient.get<CompanyOverview>(
      `/stock/${encodeURIComponent(symbol.toUpperCase())}/overview`,
    );
    return data;
  },

  async getNews(symbol: string, limit = 10): Promise<NewsItem[]> {
    const { data } = await apiClient.get<{ items: NewsItem[] }>(
      `/stock/${encodeURIComponent(symbol.toUpperCase())}/news`,
      { params: { limit } },
    );
    return data.items;
  },

  async search(q: string): Promise<SearchResult[]> {
    const { data } = await apiClient.get<{ items: SearchResult[] }>('/search', {
      params: { q },
    });
    return data.items;
  },

  async getRecommendations(): Promise<Recommendation[]> {
    const { data } =
      await apiClient.get<{ items: Recommendation[] }>('/recommendations');
    return data.items;
  },
};
