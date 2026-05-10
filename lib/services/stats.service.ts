import apiClient from '../api-client';

export interface PopularStock {
  symbol: string;
  addCount: number;
  removeCount: number;
  netCount: number;
}

export interface PopularStocksParams {
  from?: string;
  to?: string;
}

export const statsService = {
  async getPopularStocks(
    params: PopularStocksParams = {},
  ): Promise<PopularStock[]> {
    const { data } = await apiClient.get<{ items: PopularStock[] }>(
      '/stats/popular',
      { params },
    );
    return data.items;
  },
};
