import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StockLogo } from "@/components/stock-logo";
import { formatCompact, formatCurrency, formatPercent } from "@/lib/utils";
import type { Quote } from "@/types/stock";
import { cn } from "@/lib/utils";

export function QuoteHeader({ quote, name }: { quote: Quote; name?: string }) {
  const positive = quote.changePercent >= 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <StockLogo symbol={quote.symbol} size={52} />
        <div>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{quote.symbol}</h1>
            {name && (
              <span className="text-base text-muted-foreground truncate max-w-md">{name}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-4xl sm:text-5xl font-bold number">{formatCurrency(quote.price)}</span>
        <Badge variant={positive ? "bull" : "bear"} className="text-sm number">
          {positive ? <TrendingUp className="mr-1 h-3.5 w-3.5" /> : <TrendingDown className="mr-1 h-3.5 w-3.5" />}
          {formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
        </Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <Box label="เปิด" value={formatCurrency(quote.open)} />
        <Box label="สูงสุดวัน" value={formatCurrency(quote.high)} tone="bull" />
        <Box label="ต่ำสุดวัน" value={formatCurrency(quote.low)} tone="bear" />
        <Box label="ปริมาณซื้อขาย" value={formatCompact(quote.volume)} />
      </div>
    </div>
  );
}

function Box({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" }) {
  return (
    <div className="rounded-xl border border-white/5 bg-secondary/40 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("font-semibold number text-sm mt-0.5", tone === "bull" && "text-emerald-400", tone === "bear" && "text-rose-400")}>
        {value}
      </p>
    </div>
  );
}
