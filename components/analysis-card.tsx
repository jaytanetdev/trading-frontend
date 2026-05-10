import { ArrowDown, ArrowUp, Target, ShieldAlert, Crosshair, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { signalLabel } from "@/lib/analysis";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { StockAnalysis } from "@/types/stock";

export function AnalysisCard({ analysis }: { analysis: StockAnalysis }) {
  const sl = signalLabel(analysis.signal);
  return (
    <Card className="overflow-hidden">
      <div
        className={`relative px-6 py-5 border-b border-white/5 ${sl.color}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-80">
              สัญญาณวิเคราะห์
            </p>
            <h3 className="mt-1 text-2xl font-bold">{sl.th}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-mono">
              คะแนน {(analysis.score * 100).toFixed(0)}/100
            </span>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full rounded-full bg-black/30 overflow-hidden">
          <div
            className="h-full bg-current opacity-70"
            style={{
              width: `${Math.min(100, Math.abs(analysis.score) * 100)}%`,
            }}
          />
        </div>
      </div>

      <CardContent className="pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric
            icon={<Crosshair className="h-4 w-4" />}
            label="จุดเข้า"
            value={formatCurrency(analysis.entry)}
            tone="primary"
          />
          <Metric
            icon={<ShieldAlert className="h-4 w-4" />}
            label="Stop Loss"
            value={formatCurrency(analysis.stopLoss)}
            tone="bear"
          />
          <Metric
            icon={<Target className="h-4 w-4" />}
            label="เป้าหมาย 1"
            value={formatCurrency(analysis.targets[0])}
            tone="bull"
          />
          <Metric
            icon={<Sparkles className="h-4 w-4" />}
            label="R:R"
            value={`1 : ${formatNumber(analysis.riskReward, 2)}`}
            tone="neutral"
          />
        </div>

        {analysis.targets.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="text-muted-foreground">เป้าถัดไป:</span>
            {analysis.targets.slice(1).map((t, i) => (
              <Badge key={i} variant="bull">
                TP{i + 2} · {formatCurrency(t)}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3">เหตุผลการวิเคราะห์</h4>
          <ul className="space-y-2">
            {analysis.reasons.map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm rounded-lg border border-white/5 bg-secondary/30 px-3 py-2"
              >
                {r.type === "bull" ? (
                  <ArrowUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : r.type === "bear" ? (
                  <ArrowDown className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                ) : (
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                )}
                <span className="leading-relaxed">{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "bull" | "bear" | "neutral" | "primary";
}) {
  const colors = {
    bull: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20",
    bear: "text-rose-400 bg-rose-500/5 border-rose-500/20",
    neutral: "text-amber-400 bg-amber-500/5 border-amber-500/20",
    primary: "text-blue-400 bg-blue-500/5 border-blue-500/20",
  };
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${colors[tone]}`}>
      <div className="flex items-center gap-1.5 text-xs opacity-80">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-base font-semibold number">{value}</div>
    </div>
  );
}

export function IndicatorTable({ analysis }: { analysis: StockAnalysis }) {
  const ind = analysis.indicators;
  const rows: { label: string; value: string; hint?: string }[] = [
    {
      label: "RSI(14)",
      value: ind.rsi !== null ? ind.rsi.toFixed(1) : "—",
      hint:
        ind.rsi === null
          ? undefined
          : ind.rsi > 70
            ? "Overbought"
            : ind.rsi < 30
              ? "Oversold"
              : "Neutral",
    },
    {
      label: "MACD",
      value: ind.macd !== null ? ind.macd.toFixed(3) : "—",
      hint:
        ind.macd !== null && ind.macdSignal !== null
          ? ind.macd > ind.macdSignal
            ? "Bullish"
            : "Bearish"
          : undefined,
    },
    {
      label: "SMA20",
      value: ind.sma20 !== null ? formatCurrency(ind.sma20) : "—",
    },
    {
      label: "SMA50",
      value: ind.sma50 !== null ? formatCurrency(ind.sma50) : "—",
    },
    {
      label: "SMA200",
      value: ind.sma200 !== null ? formatCurrency(ind.sma200) : "—",
    },
    {
      label: "Bollinger Upper",
      value:
        ind.bollingerUpper !== null ? formatCurrency(ind.bollingerUpper) : "—",
    },
    {
      label: "Bollinger Lower",
      value:
        ind.bollingerLower !== null ? formatCurrency(ind.bollingerLower) : "—",
    },
    {
      label: "ATR(14)",
      value: ind.atr !== null ? formatCurrency(ind.atr) : "—",
      hint: ind.atr !== null ? "ความผันผวนเฉลี่ย" : undefined,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Technical Indicators</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {rows.map((r) => (
            <div
              key={r.label}
              className="rounded-lg border border-white/5 bg-secondary/30 px-3 py-2.5"
            >
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p className="font-semibold number">{r.value}</p>
              {r.hint && (
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {r.hint}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
