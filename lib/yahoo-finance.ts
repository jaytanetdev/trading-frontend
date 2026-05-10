import YahooFinance from "yahoo-finance2";
import type {
  Candle,
  CompanyOverview,
  Quote,
  Recommendation,
} from "@/types/stock";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

type CacheEntry<T> = { value: T; expires: number };
const memCache = new Map<string, CacheEntry<unknown>>();

function cacheGet<T>(key: string): T | null {
  const hit = memCache.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    memCache.delete(key);
    return null;
  }
  return hit.value as T;
}

function cacheSet<T>(key: string, value: T, ttlMs: number) {
  memCache.set(key, { value, expires: Date.now() + ttlMs });
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function num(v: unknown): number {
  if (v == null) return NaN;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : NaN;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toISODate(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function toAVTimestamp(d: Date): string {
  // NewsList expects Alpha Vantage style: YYYYMMDDTHHmmss
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
  );
}

export async function getDailyCandles(symbol: string): Promise<Candle[]> {
  const cacheKey = `candles:${symbol}`;
  const cached = cacheGet<Candle[]>(cacheKey);
  if (cached) return cached;

  const result = (await yf.chart(
    symbol,
    { period1: "1970-01-01", interval: "1d" },
    { validateResult: false }
  )) as { quotes: Array<Record<string, unknown>> };

  const out: Candle[] = [];
  for (const row of result.quotes) {
    if (!row.date) continue;
    const close = (row.close ?? row.adjclose) as number | null | undefined;
    if (close == null) continue;
    const date =
      row.date instanceof Date
        ? row.date
        : new Date(row.date as string | number);
    out.push({
      time: toISODate(date),
      open: num(row.open),
      high: num(row.high),
      low: num(row.low),
      close: num(close),
      volume: num(row.volume),
    });
  }
  out.sort((a, b) => (a.time < b.time ? -1 : 1));
  cacheSet(cacheKey, out, 6 * HOUR);
  return out;
}

export async function getQuote(symbol: string): Promise<Quote> {
  const cacheKey = `quote:${symbol}`;
  const cached = cacheGet<Quote>(cacheKey);
  if (cached) return cached;

  const q = await yf.quote(symbol, undefined, { validateResult: false });
  if (!q || q.regularMarketPrice == null) {
    throw new Error(`Quote not found for ${symbol}`);
  }

  const out: Quote = {
    symbol: q.symbol ?? symbol,
    price: num(q.regularMarketPrice),
    change: num(q.regularMarketChange),
    changePercent: num(q.regularMarketChangePercent),
    volume: num(q.regularMarketVolume),
    open: num(q.regularMarketOpen),
    high: num(q.regularMarketDayHigh),
    low: num(q.regularMarketDayLow),
    prevClose: num(q.regularMarketPreviousClose),
  };
  cacheSet(cacheKey, out, MIN);
  return out;
}

export async function getOverview(symbol: string): Promise<CompanyOverview> {
  const cacheKey = `overview:${symbol}`;
  const cached = cacheGet<CompanyOverview>(cacheKey);
  if (cached) return cached;

  const summary = (await yf.quoteSummary(
    symbol,
    {
      modules: [
        "assetProfile",
        "summaryDetail",
        "defaultKeyStatistics",
        "financialData",
        "price",
      ],
    },
    { validateResult: false }
  )) as Record<string, Record<string, unknown> | undefined>;

  const profile = (summary.assetProfile ?? {}) as Record<string, unknown>;
  const detail = (summary.summaryDetail ?? {}) as Record<string, unknown>;
  const stats = (summary.defaultKeyStatistics ?? {}) as Record<string, unknown>;
  const fin = (summary.financialData ?? {}) as Record<string, unknown>;
  const price = (summary.price ?? {}) as Record<string, unknown>;

  if (!price.symbol && !detail.marketCap) {
    throw new Error(`Overview not found for ${symbol}`);
  }

  const pick = (...keys: { src: Record<string, unknown>; key: string }[]): unknown => {
    for (const { src, key } of keys) {
      const v = src[key];
      if (v != null) return v;
    }
    return undefined;
  };

  const out: CompanyOverview = {
    symbol: String(price.symbol ?? symbol),
    name: String(price.longName ?? price.shortName ?? symbol),
    description: String(profile.longBusinessSummary ?? ""),
    exchange: String(price.exchangeName ?? price.exchange ?? ""),
    sector: String(profile.sector ?? ""),
    industry: String(profile.industry ?? ""),
    country: String(profile.country ?? ""),
    marketCap: num(pick({ src: price, key: "marketCap" }, { src: detail, key: "marketCap" })),
    peRatio: num(pick({ src: detail, key: "trailingPE" }, { src: stats, key: "trailingPE" })),
    forwardPE: num(pick({ src: detail, key: "forwardPE" }, { src: stats, key: "forwardPE" })),
    pegRatio: num(stats.pegRatio),
    eps: num(pick({ src: stats, key: "trailingEps" }, { src: fin, key: "epsTrailingTwelveMonths" })),
    dividendYield: num(detail.dividendYield),
    beta: num(pick({ src: detail, key: "beta" }, { src: stats, key: "beta" })),
    fiftyTwoWeekHigh: num(detail.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: num(detail.fiftyTwoWeekLow),
    profitMargin: num(pick({ src: fin, key: "profitMargins" }, { src: stats, key: "profitMargins" })),
    roe: num(fin.returnOnEquity),
    revenueGrowthYoY: num(fin.revenueGrowth),
    earningsGrowthYoY: num(fin.earningsGrowth),
    priceToBook: num(pick({ src: detail, key: "priceToBook" }, { src: stats, key: "priceToBook" })),
    analystTargetPrice: num(fin.targetMeanPrice),
  };

  cacheSet(cacheKey, out, DAY);
  return out;
}

export async function searchSymbols(keyword: string): Promise<
  { symbol: string; name: string; region: string; type: string }[]
> {
  const cacheKey = `search:${keyword.toLowerCase()}`;
  const cached =
    cacheGet<{ symbol: string; name: string; region: string; type: string }[]>(
      cacheKey
    );
  if (cached) return cached;

  const result = (await yf.search(
    keyword,
    { quotesCount: 10, newsCount: 0 },
    { validateResult: false }
  )) as { quotes?: unknown[] };

  const out: { symbol: string; name: string; region: string; type: string }[] =
    [];
  for (const q of result.quotes ?? []) {
    const anyQ = q as Record<string, unknown>;
    const symbol = anyQ.symbol;
    if (typeof symbol !== "string" || !symbol) continue;
    out.push({
      symbol,
      name: String(anyQ.shortname ?? anyQ.longname ?? anyQ.name ?? symbol),
      region: String(anyQ.exchDisp ?? anyQ.exchange ?? ""),
      type: String(anyQ.typeDisp ?? anyQ.quoteType ?? ""),
    });
  }
  cacheSet(cacheKey, out, DAY);
  return out;
}

export type NewsItem = {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  sentimentScore: number;
  banner?: string;
};

export async function getNews(symbol: string, limit = 10): Promise<NewsItem[]> {
  const cacheKey = `news:${symbol}:${limit}`;
  const cached = cacheGet<NewsItem[]>(cacheKey);
  if (cached) return cached;

  const result = (await yf.search(
    symbol,
    { newsCount: limit, quotesCount: 0 },
    { validateResult: false }
  )) as {
    news?: Array<{
      title?: string;
      link?: string;
      publisher?: string;
      providerPublishTime?: Date | string | number;
      thumbnail?: { resolutions?: { url: string }[] };
    }>;
  };

  const out: NewsItem[] = (result.news ?? []).slice(0, limit).map((n) => {
    const t = n.providerPublishTime;
    const published =
      t instanceof Date ? t : t ? new Date(t as string | number) : new Date();
    return {
      title: n.title ?? "",
      url: n.link ?? "",
      source: n.publisher ?? "",
      publishedAt: toAVTimestamp(published),
      summary: "",
      sentiment: "neutral",
      sentimentScore: 0,
      banner: n.thumbnail?.resolutions?.[0]?.url,
    };
  });

  cacheSet(cacheKey, out, 30 * MIN);
  return out;
}

type ScreenerScrId = "day_gainers" | "day_losers" | "most_actives";

async function runScreener(
  scrId: ScreenerScrId,
  count: number
): Promise<Record<string, unknown>[]> {
  try {
    const r = await yf.screener(
      { scrIds: scrId, count },
      undefined,
      { validateResult: false }
    );
    const rec = r as unknown as { quotes?: unknown[] };
    return (rec.quotes ?? []) as Record<string, unknown>[];
  } catch {
    return [];
  }
}

export async function getTopMovers(): Promise<Recommendation[]> {
  const cacheKey = `movers`;
  const cached = cacheGet<Recommendation[]>(cacheKey);
  if (cached) return cached;

  const [gainers, actives, losers] = await Promise.all([
    runScreener("day_gainers", 5),
    runScreener("most_actives", 5),
    runScreener("day_losers", 3),
  ]);

  const out: Recommendation[] = [];
  const push = (
    list: Record<string, unknown>[],
    reason: string,
    category: Recommendation["category"]
  ) => {
    for (const m of list) {
      const symbol = m.symbol;
      if (typeof symbol !== "string" || !symbol) continue;
      out.push({
        symbol,
        name:
          (typeof m.shortName === "string" && m.shortName) ||
          (typeof m.longName === "string" && m.longName) ||
          undefined,
        price: num(m.regularMarketPrice),
        changePercent: num(m.regularMarketChangePercent),
        reason,
        category,
      });
    }
  };

  push(gainers, "หุ้นที่มีโมเมนตัมขาขึ้นแรงสุดในวันนี้", "TOP_GAINER");
  push(actives, "วอลุ่มซื้อขายสูงสุด — สภาพคล่องดี เหมาะกับการเข้า-ออกเร็ว", "ACTIVE");
  push(losers, "ปรับฐานแรง — อาจเป็นโอกาสรีบาวน์ทางเทคนิคถ้าพื้นฐานแกร่ง", "TOP_LOSER");

  cacheSet(cacheKey, out, 2 * HOUR);
  return out;
}
