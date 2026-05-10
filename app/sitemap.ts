import { MetadataRoute } from "next";

const BASE_URL = "https://stock-analysis.techhousesoft.com";

const POPULAR_SYMBOLS = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "NFLX",
  "AMD", "INTC", "JPM", "BAC", "WMT", "DIS", "V", "MA", "PYPL",
  "CRM", "ORCL", "IBM", "UBER", "COIN", "PLTR", "SOFI", "RIVN",
  "SHOP", "SNAP", "SPOT", "RBLX", "HOOD",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const stockUrls: MetadataRoute.Sitemap = POPULAR_SYMBOLS.map((symbol) => ({
    url: `${BASE_URL}/stock/${symbol}`,
    lastModified: new Date(),
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/popular`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    ...stockUrls,
  ];
}
