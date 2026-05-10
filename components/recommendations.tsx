"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Flame, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { Recommendation } from "@/types/stock";

const ICONS: Record<Recommendation["category"], React.ElementType> = {
  TOP_GAINER: Flame,
  TOP_LOSER: TrendingDown,
  ACTIVE: Zap,
  MOMENTUM: TrendingUp,
};

const LABELS: Record<Recommendation["category"], string> = {
  TOP_GAINER: "พุ่งแรง",
  TOP_LOSER: "ปรับฐาน",
  ACTIVE: "วอลุ่มสูง",
  MOMENTUM: "โมเมนตัม",
};

export function Recommendations() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import("@/lib/services/stock.service").then(({ stockService }) =>
      stockService
        .getRecommendations()
        .then((items) => setItems(items))
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false))
    );
  }, []);

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            ไม่สามารถโหลดคำแนะนำได้: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const Icon = ICONS[item.category];
        const isPositive = item.changePercent >= 0;
        return (
          <Link
            key={item.symbol + item.category}
            href={`/stock/${item.symbol}`}
            className="group"
          >
            <Card className="h-full transition-all hover:border-primary/30 hover:shadow-[0_0_30px_-10px_hsl(142_71%_45%/0.4)]">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        item.category === "TOP_GAINER" &&
                          "bg-emerald-500/10 text-emerald-400",
                        item.category === "TOP_LOSER" &&
                          "bg-rose-500/10 text-rose-400",
                        item.category === "ACTIVE" &&
                          "bg-blue-500/10 text-blue-400",
                        item.category === "MOMENTUM" &&
                          "bg-amber-500/10 text-amber-400"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.symbol}</CardTitle>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {LABELS[item.category]}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold number">
                    {formatCurrency(item.price)}
                  </span>
                  <Badge variant={isPositive ? "bull" : "bear"} className="number">
                    {formatPercent(item.changePercent)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {item.reason}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
