"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { NewsItem } from "@/types/stock";

const SENTIMENT_LABEL = {
  bullish: { th: "เชิงบวก", variant: "bull" as const },
  bearish: { th: "เชิงลบ", variant: "bear" as const },
  neutral: { th: "เป็นกลาง", variant: "neutral" as const },
};

function parseTime(s: string): string {
  // Alpha Vantage format: 20240115T133000
  if (!s || s.length < 13) return s;
  const y = s.slice(0, 4);
  const m = s.slice(4, 6);
  const d = s.slice(6, 8);
  const h = s.slice(9, 11);
  const mi = s.slice(11, 13);
  return `${y}-${m}-${d} ${h}:${mi}`;
}

export function NewsList({ symbol }: { symbol: string }) {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import("@/lib/services/stock.service").then(({ stockService }) =>
      stockService
        .getNews(symbol)
        .then(setItems)
        .catch((e: Error) => setError(e.message))
    );
  }, [symbol]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Newspaper className="h-4 w-4 text-primary" />
          ข่าวล่าสุด & Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items === null && !error ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </>
        ) : error ? (
          <p className="text-xs text-muted-foreground">
            ไม่สามารถโหลดข่าวได้: {error}
          </p>
        ) : items?.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            ยังไม่มีข่าวในช่วงนี้
          </p>
        ) : (
          items?.map((n, i) => {
            const sl = SENTIMENT_LABEL[n.sentiment];
            return (
              <a
                key={i}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-white/5 bg-secondary/30 p-3 transition-colors hover:border-primary/30 hover:bg-secondary/50 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {n.title}
                  </h4>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">{n.source}</span>
                    <span>·</span>
                    <span className="shrink-0">{parseTime(n.publishedAt)}</span>
                  </div>
                  <Badge variant={sl.variant} className="text-[10px] shrink-0">
                    {sl.th} ({n.sentimentScore.toFixed(2)})
                  </Badge>
                </div>
              </a>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
