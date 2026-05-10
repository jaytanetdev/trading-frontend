import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { detectSmartMoney } from "@/lib/smart-money";
import type { StockResponse } from "@/lib/services/stock.service";
import type { CompanyOverview } from "@/types/stock";
import { ChartSection } from "@/components/chart-section";
import { QuoteHeader } from "@/components/quote-header";
import { AnalysisCard, IndicatorTable } from "@/components/analysis-card";
import { OverviewCard } from "@/components/overview-card";
import { NewsList } from "@/components/news-list";
import { WatchlistButton } from "@/components/watchlist-button";
import { StockSearch } from "@/components/stock-search";
import { SmartMoneyPanel } from "@/components/smart-money-panel";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 3600;

function getBackendUrl() {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  const url = raw.startsWith("http") ? raw : `https://${raw}`;
  return url.replace(/\/$/, "");
}

async function fetchStockFromBackend(symbol: string): Promise<StockResponse> {
  const res = await fetch(`${getBackendUrl()}/stock/${symbol}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Stock not found: ${symbol}`);
  return res.json();
}

async function fetchOverviewFromBackend(
  symbol: string
): Promise<CompanyOverview | null> {
  try {
    const res = await fetch(`${getBackendUrl()}/stock/${symbol}/overview`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();

  try {
    const [stockData, overview] = await Promise.all([
      fetchStockFromBackend(symbol).catch(() => null),
      fetchOverviewFromBackend(symbol),
    ]);

    const quote = stockData?.quote;
    const name = overview?.name ?? symbol;
    const price = quote?.price ?? 0;
    const changePercent = quote?.changePercent ?? 0;
    const sign = changePercent >= 0 ? "+" : "";
    const priceStr = formatCurrency(price);
    const changeStr = `${sign}${changePercent.toFixed(2)}%`;

    return {
      title: `${symbol} ${priceStr} (${changeStr})`,
      description: `วิเคราะห์หุ้น ${name} (${symbol}) แนวรับ/แนวต้าน จุดเข้าซื้อ Stop Loss Smart Money Real-time`,
      openGraph: {
        title: `${symbol} ${priceStr} (${changeStr}) | JTL Stock`,
        description: `วิเคราะห์หุ้น ${name} — แนวรับ/แนวต้าน, จุดเข้าซื้อ, Stop Loss, เป้าทำกำไร, Smart Money`,
      },
      alternates: {
        canonical: `/stock/${symbol}`,
      },
    };
  } catch {
    return {
      title: `${symbol} — วิเคราะห์หุ้น`,
      description: `วิเคราะห์หุ้น ${symbol} แนวรับแนวต้าน Real-time`,
      alternates: {
        canonical: `/stock/${symbol}`,
      },
    };
  }
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: raw } = await params;
  const symbol = raw.toUpperCase();

  let candles, quote, overview, analysis, error: string | null = null;
  try {
    const [stockData, ov] = await Promise.all([
      fetchStockFromBackend(symbol),
      fetchOverviewFromBackend(symbol),
    ]);
    candles = stockData.candles;
    quote = stockData.quote;
    analysis = stockData.analysis;
    overview = ov;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> กลับหน้าแรก
        </Link>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>ไม่สามารถดึงข้อมูล {symbol}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="mt-4">
              <StockSearch />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!candles || !candles.length || !quote) notFound();

  const smartMoney = detectSmartMoney(candles);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> หน้าแรก
        </Link>
        <div className="w-full max-w-md">
          <StockSearch />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <QuoteHeader quote={quote} name={overview?.name} />
        <WatchlistButton symbol={symbol} />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>กราฟราคาพร้อมแนวรับ-แนวต้าน</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartSection
            candles={candles}
            analysis={analysis}
            fiftyTwoWeekHigh={overview?.fiftyTwoWeekHigh}
            fiftyTwoWeekLow={overview?.fiftyTwoWeekLow}
          />
          {analysis && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <KeyLevel
                label="แนวรับใกล้สุด"
                value={
                  analysis.supportResistance.support[
                    analysis.supportResistance.support.length - 1
                  ]
                }
                tone="bull"
              />
              <KeyLevel
                label="ราคาปัจจุบัน"
                value={quote.price}
                tone="primary"
              />
              <KeyLevel
                label="แนวต้านใกล้สุด"
                value={analysis.supportResistance.resistance[0]}
                tone="bear"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-column on desktop */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {analysis ? (
            <>
              <AnalysisCard analysis={analysis} />
              <IndicatorTable analysis={analysis} />
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  ข้อมูลย้อนหลังไม่พอสำหรับการวิเคราะห์ (ต้องมีอย่างน้อย 50 แท่ง)
                </p>
              </CardContent>
            </Card>
          )}
          <NewsList symbol={symbol} />
        </div>
        <div className="space-y-6">
          {smartMoney && <SmartMoneyPanel data={smartMoney} />}
          <OverviewCard symbol={symbol} />
        </div>
      </div>
    </div>
  );
}

function KeyLevel({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | undefined;
  tone: "bull" | "bear" | "primary";
}) {
  const colors = {
    bull: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
    bear: "border-rose-500/30 bg-rose-500/5 text-rose-400",
    primary: "border-blue-500/30 bg-blue-500/5 text-blue-400",
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${colors[tone]}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="font-semibold number text-base mt-0.5">
        {value !== undefined ? formatCurrency(value) : "—"}
      </p>
    </div>
  );
}
