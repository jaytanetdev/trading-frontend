"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";
import type { Quote } from "@/types/stock";

const KEY = "stocksense.portfolio";

type Holding = {
  id: string;
  symbol: string;
  shares: number;
  avgPrice: number;
};

function loadPortfolio(): Holding[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Holding[]) : [];
  } catch {
    return [];
  }
}

function savePortfolio(items: Holding[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [form, setForm] = useState({ symbol: "", shares: "", avgPrice: "" });

  useEffect(() => {
    const list = loadPortfolio();
    setHoldings(list);
  }, []);

  useEffect(() => {
    const symbols = [...new Set(holdings.map((h) => h.symbol))];
    symbols.forEach((s) => {
      if (quotes[s]) return;
      fetch(`/api/stock/${s}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.quote) setQuotes((q) => ({ ...q, [s]: d.quote }));
        })
        .catch(() => {});
    });
  }, [holdings, quotes]);

  const stats = useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;
    let dailyPnL = 0;
    holdings.forEach((h) => {
      const q = quotes[h.symbol];
      const price = q?.price ?? h.avgPrice;
      totalCost += h.shares * h.avgPrice;
      totalValue += h.shares * price;
      if (q) dailyPnL += h.shares * q.change;
    });
    const pnl = totalValue - totalCost;
    const pnlPercent = totalCost === 0 ? 0 : (pnl / totalCost) * 100;
    return { totalCost, totalValue, pnl, pnlPercent, dailyPnL };
  }, [holdings, quotes]);

  const add = () => {
    const symbol = form.symbol.trim().toUpperCase();
    const shares = parseFloat(form.shares);
    const avgPrice = parseFloat(form.avgPrice);
    if (!symbol || !shares || !avgPrice) return;
    const next: Holding[] = [
      ...holdings,
      { id: crypto.randomUUID(), symbol, shares, avgPrice },
    ];
    setHoldings(next);
    savePortfolio(next);
    setForm({ symbol: "", shares: "", avgPrice: "" });
  };

  const remove = (id: string) => {
    const next = holdings.filter((h) => h.id !== id);
    setHoldings(next);
    savePortfolio(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Briefcase className="h-7 w-7 text-primary" />
          พอร์ตของฉัน
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          บันทึกการซื้อ-ขาย คำนวณกำไร-ขาดทุนตามราคาตลาด
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="มูลค่าพอร์ต"
          value={formatCurrency(stats.totalValue)}
          accent="primary"
        />
        <SummaryCard
          label="ต้นทุน"
          value={formatCurrency(stats.totalCost)}
        />
        <SummaryCard
          label="กำไร/ขาดทุนรวม"
          value={formatCurrency(stats.pnl)}
          subValue={formatPercent(stats.pnlPercent)}
          accent={stats.pnl >= 0 ? "bull" : "bear"}
        />
        <SummaryCard
          label="P/L วันนี้"
          value={formatCurrency(stats.dailyPnL)}
          accent={stats.dailyPnL >= 0 ? "bull" : "bear"}
        />
      </div>

      {/* Add form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            เพิ่มรายการ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Input
              placeholder="Symbol (เช่น NVDA)"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            />
            <Input
              placeholder="จำนวนหุ้น"
              type="number"
              value={form.shares}
              onChange={(e) => setForm({ ...form, shares: e.target.value })}
            />
            <Input
              placeholder="ราคาเฉลี่ย"
              type="number"
              value={form.avgPrice}
              onChange={(e) => setForm({ ...form, avgPrice: e.target.value })}
            />
            <Button onClick={add}>เพิ่ม</Button>
          </div>
        </CardContent>
      </Card>

      {/* Holdings */}
      {holdings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-base font-medium">ยังไม่มีรายการในพอร์ต</p>
            <p className="text-sm text-muted-foreground mt-1">
              เพิ่มหุ้นด้านบนเพื่อเริ่มติดตามกำไร-ขาดทุน
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden sm:grid grid-cols-7 gap-4 px-5 py-3 border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground">
              <span>Symbol</span>
              <span>หุ้น</span>
              <span>เฉลี่ย</span>
              <span>ราคาตลาด</span>
              <span>มูลค่า</span>
              <span>P/L</span>
              <span></span>
            </div>
            {holdings.map((h) => {
              const q = quotes[h.symbol];
              const price = q?.price ?? h.avgPrice;
              const cost = h.shares * h.avgPrice;
              const value = h.shares * price;
              const pnl = value - cost;
              const pnlPct = cost === 0 ? 0 : (pnl / cost) * 100;
              const positive = pnl >= 0;
              return (
                <div
                  key={h.id}
                  className="grid grid-cols-2 sm:grid-cols-7 gap-x-4 gap-y-1 px-5 py-4 border-b border-white/5 last:border-0 items-center"
                >
                  <div className="font-semibold flex items-center gap-2">
                    {h.symbol}
                    {q && (
                      <Badge
                        variant={q.changePercent >= 0 ? "bull" : "bear"}
                        className="number text-[10px]"
                      >
                        {formatPercent(q.changePercent)}
                      </Badge>
                    )}
                  </div>
                  <div className="number text-sm">
                    <span className="sm:hidden text-xs text-muted-foreground">หุ้น: </span>
                    {h.shares}
                  </div>
                  <div className="number text-sm">
                    <span className="sm:hidden text-xs text-muted-foreground">เฉลี่ย: </span>
                    {formatCurrency(h.avgPrice)}
                  </div>
                  <div className="number text-sm">
                    <span className="sm:hidden text-xs text-muted-foreground">ราคาตลาด: </span>
                    {formatCurrency(price)}
                  </div>
                  <div className="number text-sm">
                    <span className="sm:hidden text-xs text-muted-foreground">มูลค่า: </span>
                    {formatCurrency(value)}
                  </div>
                  <div
                    className={cn(
                      "number text-sm font-semibold flex items-center gap-1.5",
                      positive ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {positive ? (
                      <TrendingUp className="h-3.5 w-3.5" />
                    ) : (
                      <TrendingDown className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {formatCurrency(pnl)} ({formatPercent(pnlPct)})
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(h.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-rose-400" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  subValue,
  accent,
}: {
  label: string;
  value: string;
  subValue?: string;
  accent?: "bull" | "bear" | "primary";
}) {
  const colors = {
    bull: "border-emerald-500/30 from-emerald-500/10",
    bear: "border-rose-500/30 from-rose-500/10",
    primary: "border-blue-500/30 from-blue-500/10",
  };
  return (
    <Card
      className={cn(
        accent && `bg-gradient-to-br to-transparent ${colors[accent]}`
      )}
    >
      <CardContent className="pt-5">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "text-2xl font-bold number mt-1",
            accent === "bull" && "text-emerald-400",
            accent === "bear" && "text-rose-400"
          )}
        >
          {value}
        </p>
        {subValue && (
          <p
            className={cn(
              "text-xs number mt-0.5",
              accent === "bull" && "text-emerald-400",
              accent === "bear" && "text-rose-400"
            )}
          >
            {subValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
