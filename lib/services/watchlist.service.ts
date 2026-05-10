import apiClient, { getOrCreateClientId } from '../api-client';

export interface WatchlistItem {
  id: number;
  clientId: string;
  symbol: string;
  addedAt: string;
}

export const watchlistService = {
  async getWatchlist(): Promise<WatchlistItem[]> {
    const clientId = getOrCreateClientId();
    if (!clientId) return [];
    const { data } = await apiClient.get<{ items: WatchlistItem[] }>(
      `/watchlist/${encodeURIComponent(clientId)}`,
    );
    return data.items;
  },

  async addToWatchlist(symbol: string): Promise<WatchlistItem> {
    const clientId = getOrCreateClientId();
    const { data } = await apiClient.post<WatchlistItem>(
      `/watchlist/${encodeURIComponent(clientId)}/${encodeURIComponent(symbol.toUpperCase())}`,
    );
    return data;
  },

  async removeFromWatchlist(symbol: string): Promise<{ message: string }> {
    const clientId = getOrCreateClientId();
    const { data } = await apiClient.delete<{ message: string }>(
      `/watchlist/${encodeURIComponent(clientId)}/${encodeURIComponent(symbol.toUpperCase())}`,
    );
    return data;
  },
};
