"use client";

import { useState } from "react";
import { BarChart2, RefreshCw, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePopularStocks } from "@/hooks/usePopularStocks";
import Link from "next/link";

const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

const CHART_COLORS = [
  "hsl(142 76% 48%)",
  "hsl(217 91% 60%)",
  "hsl(280 80% 60%)",
  "hsl(38 92% 50%)",
  "hsl(355 78% 56%)",
  "hsl(190 80% 50%)",
  "hsl(142 60% 40%)",
  "hsl(217 70% 50%)",
  "hsl(280 60% 50%)",
  "hsl(38 75% 45%)",
];

export default function PopularPage() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);

  const { data, loading, error, refetch } = usePopularStocks(
    { from, to },
    AUTO_REFRESH_MS,
  );

  const top10 = data.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" />
            Popular Stocks
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            หุ้นที่ถูก Watchlist บ่อยที่สุด · อัพเดทอัตโนมัติทุก 5 นาที
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refetch}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          รีเฟรช
        </Button>
      </section>

      {/* Date range filter */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                จากวันที่
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-9 rounded-md border border-white/10 bg-secondary/50 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">
                ถึงวันที่
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-9 rounded-md border border-white/10 bg-secondary/50 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="h-4 w-4 text-primary" />
            Top 10 หุ้นที่ถูก Watch มากที่สุด
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                ไม่สามารถโหลดข้อมูลได้: {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={refetch}
              >
                ลองใหม่
              </Button>
            </div>
          ) : top10.length === 0 ? (
            <div className="py-12 text-center">
              <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                ยังไม่มีข้อมูล Watchlist ในช่วงเวลาที่เลือก
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={top10}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(210 40% 98% / 0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="symbol"
                  tick={{ fill: "hsl(215 20% 65%)", fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as {
                      symbol: string;
                      addCount: number;
                      removeCount: number;
                      netCount: number;
                    };
                    return (
                      <div
                        className="rounded-xl border border-white/10 bg-card p-3 text-sm shadow-xl"
                        style={{ minWidth: 160 }}
                      >
                        <p className="font-bold text-base mb-2">{d.symbol}</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between gap-4">
                            <span>เพิ่ม</span>
                            <span className="text-emerald-400 font-semibold">
                              +{d.addCount}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span>ลบ</span>
                            <span className="text-rose-400 font-semibold">
                              -{d.removeCount}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 pt-1 border-t border-white/10">
                            <span>Net</span>
                            <span className="font-semibold text-foreground">
                              {d.netCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                  cursor={{ fill: "hsl(210 40% 98% / 0.04)" }}
                />
                <Bar dataKey="addCount" radius={[6, 6, 0, 0]}>
                  {top10.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {!loading && top10.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">รายละเอียด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 text-left font-medium">อันดับ</th>
                    <th className="pb-2 text-left font-medium">หุ้น</th>
                    <th className="pb-2 text-right font-medium">เพิ่ม</th>
                    <th className="pb-2 text-right font-medium">ลบ</th>
                    <th className="pb-2 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {top10.map((row, i) => (
                    <tr
                      key={row.symbol}
                      className="border-b border-white/[0.04] last:border-0 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-2.5 pr-4">
                        <span
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            background: `${CHART_COLORS[i % CHART_COLORS.length]}22`,
                            color: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        >
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <Link
                          href={`/stock/${row.symbol}`}
                          className="font-bold hover:text-primary transition-colors"
                        >
                          {row.symbol}
                        </Link>
                      </td>
                      <td className="py-2.5 text-right text-emerald-400 font-semibold">
                        +{row.addCount}
                      </td>
                      <td className="py-2.5 text-right text-rose-400 font-semibold">
                        -{row.removeCount}
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        {row.netCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
