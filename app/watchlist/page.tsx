"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Trash2, ArrowUpRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StockSearch } from "@/components/stock-search";
import { StockLogo } from "@/components/stock-logo";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { Quote, StockAnalysis } from "@/types/stock";
import { signalLabel } from "@/lib/analysis";
import { useWatchlist } from "@/hooks/useWatchlist";
import { stockService } from "@/lib/services/stock.service";

type Row = {
  symbol: string;
  quote?: Quote;
  analysis?: StockAnalysis | null;
  loading: boolean;
  error?: string;
};

export default function WatchlistPage() {
  const { items, loading: watchlistLoading, remove } = useWatchlist();
  const [rows, setRows] = useState<Row[]>([]);

  // When the watchlist items change, fetch quotes/analysis for each
  useEffect(() => {
    if (watchlistLoading) return;
    const symbols = items.map((i) => i.symbol);

    if (!symbols.length) {
      setRows([]);
      return;
    }

    setRows(symbols.map((s) => ({ symbol: s, loading: true })));

    symbols.forEach((s) => {
      stockService
        .getStock(s)
        .then((d) => {
          setRows((rs) =>
            rs.map((r) =>
              r.symbol === s
                ? { ...r, quote: d.quote, analysis: d.analysis, loading: false }
                : r
            )
          );
        })
        .catch((e: Error) => {
          setRows((rs) =>
            rs.map((r) =>
              r.symbol === s ? { ...r, loading: false, error: e.message } : r
            )
          );
        });
    });
  }, [items, watchlistLoading]);

  const handleRemove = async (symbol: string) => {
    try {
      await remove(symbol);
      setRows((rs) => rs.filter((r) => r.symbol !== symbol));
    } catch {
      // Ignore — the item remains in the list
    }
  };

  if (watchlistLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">กำลังโหลด Watchlist...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-7 w-7 fill-primary text-primary" />
            Watchlist
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            หุ้นที่คุณกำลังจับตา · บันทึกในระบบ Cloud
          </p>
        </div>
        <div className="w-full max-w-md">
          <StockSearch />
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-base font-medium">ยังไม่มีหุ้นใน Watchlist</p>
            <p className="text-sm text-muted-foreground mt-1">
              ค้นหาหุ้นด้านบนแล้วกด &quot;เพิ่ม Watchlist&quot; จากหน้าราคา
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <WatchlistRow
              key={row.symbol}
              row={row}
              onRemove={() => handleRemove(row.symbol)}
            />
          ))}
        </div>
      )}

      {rows.some((r) => r.analysis) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              Alert ตามเทคนิค
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {rows
                .filter((r) => r.analysis)
                .filter(
                  (r) =>
                    r.analysis &&
                    (r.analysis.signal === "STRONG_BUY" ||
                      r.analysis.signal === "STRONG_SELL")
                )
                .map((r) => (
                  <li
                    key={r.symbol}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-secondary/30 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold">{r.symbol}</span>
                    <Badge
                      variant={
                        r.analysis!.signal === "STRONG_BUY" ? "bull" : "bear"
                      }
                    >
                      {signalLabel(r.analysis!.signal).th}
                    </Badge>
                  </li>
                ))}
              {rows
                .filter((r) => r.analysis)
                .filter(
                  (r) =>
                    !(
                      r.analysis &&
                      (r.analysis.signal === "STRONG_BUY" ||
                        r.analysis.signal === "STRONG_SELL")
                    )
                ).length === rows.filter((r) => r.analysis).length && (
                <li className="text-sm text-muted-foreground">
                  ยังไม่มีสัญญาณเร่งด่วน — ตอนนี้ทุกตัวอยู่ในโซน HOLD/BUY/SELL ปกติ
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WatchlistRow({
  row,
  onRemove,
}: {
  row: Row;
  onRemove: () => void;
}) {
  if (row.loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (row.error) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{row.symbol}</span>
            <Button size="icon" variant="ghost" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-rose-400">{row.error}</p>
        </CardContent>
      </Card>
    );
  }

  const positive = (row.quote?.changePercent ?? 0) >= 0;
  const sl = row.analysis ? signalLabel(row.analysis.signal) : null;

  return (
    <Card className="group hover:border-primary/30 transition-colors">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/stock/${row.symbol}`} className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <StockLogo symbol={row.symbol} size={36} className="shrink-0" />
              <h3 className="font-bold">{row.symbol}</h3>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-semibold number">
                {formatCurrency(row.quote?.price ?? 0)}
              </span>
              <Badge variant={positive ? "bull" : "bear"} className="number text-[10px]">
                {formatPercent(row.quote?.changePercent ?? 0)}
              </Badge>
            </div>
          </Link>
          <Button size="icon" variant="ghost" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-rose-400" />
          </Button>
        </div>
        {sl && (
          <div className={`rounded-md border px-2.5 py-1.5 text-xs ${sl.color}`}>
            สัญญาณ: <span className="font-semibold">{sl.th}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
