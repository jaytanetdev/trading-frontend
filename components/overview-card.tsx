"use client";

import { useEffect, useState } from "react";
import { Building2, ChevronDown, Globe2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  classifyPE,
  formatCompact,
  formatCurrency,
  formatNumber,
} from "@/lib/utils";
import type { CompanyOverview } from "@/types/stock";
import { cn } from "@/lib/utils";

export function OverviewCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<CompanyOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    import("@/lib/services/stock.service").then(({ stockService }) =>
      stockService
        .getOverview(symbol)
        .then(setData)
        .catch((e: Error) => setError(e.message))
        .finally(() => setLoading(false))
    );
  }, [symbol]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            ไม่สามารถโหลดข้อมูลบริษัทได้: {error || "ไม่ทราบสาเหตุ"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const pe = classifyPE(data.peRatio);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{data.name}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {data.exchange}
              </span>
              {data.sector && <span>· {data.sector}</span>}
              {data.country && (
                <span className="inline-flex items-center gap-1">
                  · <Globe2 className="h-3.5 w-3.5" />
                  {data.country}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* PE classification */}
        <div className="rounded-xl border border-white/5 bg-gradient-to-br from-secondary/40 to-transparent p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              การประเมินราคาเทียบกำไร (P/E)
            </p>
            <Badge variant={pe.color === "bull" ? "bull" : pe.color === "bear" ? "bear" : "neutral"}>
              {pe.label}
            </Badge>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold number">
              {formatNumber(data.peRatio, 2)}
            </span>
            <span className="text-xs text-muted-foreground">
              EPS {formatNumber(data.eps, 2)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{pe.description}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <Stat label="Market Cap" value={`$${formatCompact(data.marketCap)}`} />
          <Stat label="Forward P/E" value={formatNumber(data.forwardPE, 2)} />
          <Stat label="PEG" value={formatNumber(data.pegRatio, 2)} />
          <Stat label="Beta" value={formatNumber(data.beta, 2)} />
          <Stat
            label="Dividend Yield"
            value={
              Number.isFinite(data.dividendYield)
                ? `${(data.dividendYield * 100).toFixed(2)}%`
                : "—"
            }
          />
          <Stat label="P/B" value={formatNumber(data.priceToBook, 2)} />
          <Stat
            label="ROE"
            value={
              Number.isFinite(data.roe)
                ? `${(data.roe * 100).toFixed(2)}%`
                : "—"
            }
          />
          <Stat
            label="Profit Margin"
            value={
              Number.isFinite(data.profitMargin)
                ? `${(data.profitMargin * 100).toFixed(2)}%`
                : "—"
            }
          />
          <Stat
            label="Rev Growth (YoY)"
            value={
              Number.isFinite(data.revenueGrowthYoY)
                ? `${(data.revenueGrowthYoY * 100).toFixed(2)}%`
                : "—"
            }
            tone={data.revenueGrowthYoY > 0 ? "bull" : "bear"}
          />
          <Stat
            label="52W High"
            value={formatCurrency(data.fiftyTwoWeekHigh)}
          />
          <Stat label="52W Low" value={formatCurrency(data.fiftyTwoWeekLow)} />
          <Stat
            label="Analyst Target"
            value={formatCurrency(data.analystTargetPrice)}
            tone="primary"
          />
        </div>

        {/* Description */}
        {data.description && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold">ทำธุรกิจอะไร</h4>
            </div>
            <div className="relative">
              <p
                className={cn(
                  "text-sm leading-relaxed text-muted-foreground",
                  !expanded && "line-clamp-4"
                )}
              >
                {data.description}
              </p>
              <button
                onClick={() => setExpanded((e) => !e)}
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {expanded ? "ย่อ" : "อ่านต่อ"}
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    expanded && "rotate-180"
                  )}
                />
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "bull" | "bear" | "primary";
}) {
  const tones = {
    bull: "text-emerald-400",
    bear: "text-rose-400",
    primary: "text-blue-400",
  };
  return (
    <div className="rounded-lg border border-white/5 bg-secondary/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("font-semibold number text-sm mt-0.5", tone && tones[tone])}>
        {value}
      </p>
    </div>
  );
}
