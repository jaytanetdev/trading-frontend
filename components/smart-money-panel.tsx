import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus, Activity, Users, Cpu, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SmartMoneyAnalysis, FlowType, SmartMoneyBar } from "@/lib/smart-money";

const FLOW_CONFIG: Record<FlowType, { label: string; color: string; bg: string; border: string }> = {
  SMART_BUY:   { label: "รายใหญ่ซื้อ",   color: "text-emerald-400", bg: "bg-emerald-500",  border: "border-emerald-500/30" },
  SMART_SELL:  { label: "รายใหญ่ขาย",   color: "text-rose-400",    bg: "bg-rose-500",     border: "border-rose-500/30" },
  RETAIL_BUY:  { label: "รายย่อยซื้อ",  color: "text-blue-400",   bg: "bg-blue-400",     border: "border-blue-400/30" },
  RETAIL_SELL: { label: "รายย่อยขาย",   color: "text-orange-400", bg: "bg-orange-400",   border: "border-orange-400/30" },
  PROGRAM:     { label: "Program",       color: "text-yellow-400", bg: "bg-yellow-400",   border: "border-yellow-400/30" },
  NEUTRAL:     { label: "Neutral",       color: "text-slate-400",  bg: "bg-slate-500",    border: "border-slate-500/30" },
};

export function SmartMoneyPanel({ data }: { data: SmartMoneyAnalysis }) {
  const cfg = FLOW_CONFIG[data.dominantFlow];
  const cmfPct = data.cmf !== null ? Math.min(1, Math.max(-1, data.cmf)) : 0;
  const cmfBarLeft = Math.min(100, Math.max(0, (cmfPct + 1) / 2 * 100));

  const counts = countBars(data.recentBars);
  const total = data.recentBars.length || 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Smart Money · รายใหญ่ vs รายย่อย
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Dominant signal */}
        <div className={`rounded-xl border ${cfg.border} px-4 py-3`}>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">สัญญาณหลักวันนี้</p>
          <div className="flex items-center justify-between gap-2">
            <span className={`text-lg font-bold ${cfg.color}`}>{cfg.label}</span>
            <span className="text-xs text-muted-foreground text-right leading-snug max-w-[60%]">
              {data.interpretation}
            </span>
          </div>
        </div>

        {/* CMF Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Chaikin Money Flow (CMF)</span>
            <span className={`font-mono font-semibold ${cmfPct > 0.05 ? "text-emerald-400" : cmfPct < -0.05 ? "text-rose-400" : "text-slate-400"}`}>
              {data.cmf !== null ? (data.cmf >= 0 ? "+" : "") + data.cmf.toFixed(3) : "—"}
            </span>
          </div>
          <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 w-px h-full bg-white/20 z-10" />
            {/* Bar */}
            <div
              className={`absolute top-0 h-full rounded-full transition-all ${cmfPct >= 0 ? "bg-emerald-500/70" : "bg-rose-500/70"}`}
              style={
                cmfPct >= 0
                  ? { left: "50%", width: `${cmfPct * 50}%` }
                  : { right: `${50 + cmfPct * 50}%`, left: `${cmfBarLeft}%` }
              }
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
            <span>ขาย -1</span>
            <span>0</span>
            <span>ซื้อ +1</span>
          </div>
        </div>

        {/* OBV Trend */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground text-xs">OBV Trend:</span>
          {data.obvTrend === "UP" && <><TrendingUp className="h-4 w-4 text-emerald-400" /><span className="text-emerald-400 font-medium text-xs">ขาขึ้น — เงินไหลเข้า</span></>}
          {data.obvTrend === "DOWN" && <><TrendingDown className="h-4 w-4 text-rose-400" /><span className="text-rose-400 font-medium text-xs">ขาลง — เงินไหลออก</span></>}
          {data.obvTrend === "FLAT" && <><Minus className="h-4 w-4 text-slate-400" /><span className="text-slate-400 font-medium text-xs">Sideways</span></>}
        </div>

        {/* Breakdown grid */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">สัดส่วน 20 วันล่าสุด</p>
          <div className="grid grid-cols-2 gap-2">
            <BreakdownRow
              icon={<Building2 className="h-3 w-3" />}
              label="รายใหญ่ซื้อ"
              count={counts.SMART_BUY}
              total={total}
              color="bg-emerald-500"
              textColor="text-emerald-400"
            />
            <BreakdownRow
              icon={<Building2 className="h-3 w-3" />}
              label="รายใหญ่ขาย"
              count={counts.SMART_SELL}
              total={total}
              color="bg-rose-500"
              textColor="text-rose-400"
            />
            <BreakdownRow
              icon={<Users className="h-3 w-3" />}
              label="รายย่อยซื้อ"
              count={counts.RETAIL_BUY}
              total={total}
              color="bg-blue-400"
              textColor="text-blue-400"
            />
            <BreakdownRow
              icon={<Users className="h-3 w-3" />}
              label="รายย่อยขาย"
              count={counts.RETAIL_SELL}
              total={total}
              color="bg-orange-400"
              textColor="text-orange-400"
            />
          </div>
          {counts.PROGRAM > 0 && (
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-3 py-1.5">
              <Cpu className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
              <span className="text-xs text-yellow-400">
                Program/Algo Trading {counts.PROGRAM} วัน — วอลุ่มสูงผิดปกติ
              </span>
            </div>
          )}
        </div>

        {/* Mini bar strip */}
        <div>
          <p className="text-[10px] text-muted-foreground mb-1.5">กิจกรรม 20 วัน (ซ้าย = เก่า → ขวา = ล่าสุด)</p>
          <div className="flex gap-0.5 h-8 items-end">
            {data.recentBars.map((b, i) => {
              const cfg = FLOW_CONFIG[b.flowType];
              const heightPct = Math.min(100, Math.round(b.volumeRatio * 50));
              return (
                <div
                  key={i}
                  title={`${b.time} · ${cfg.label} · Vol ${b.volumeRatio.toFixed(1)}x`}
                  className={`flex-1 rounded-sm ${cfg.bg} opacity-80`}
                  style={{ height: `${heightPct}%`, minHeight: 4 }}
                />
              );
            })}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-muted-foreground">
            <LegendDot color="bg-emerald-500" label="รายใหญ่ซื้อ" />
            <LegendDot color="bg-rose-500" label="รายใหญ่ขาย" />
            <LegendDot color="bg-blue-400" label="รายย่อยซื้อ" />
            <LegendDot color="bg-orange-400" label="รายย่อยขาย" />
            <LegendDot color="bg-yellow-400" label="Program" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function countBars(bars: SmartMoneyBar[]) {
  const counts: Record<FlowType, number> = {
    SMART_BUY: 0, SMART_SELL: 0, RETAIL_BUY: 0, RETAIL_SELL: 0, PROGRAM: 0, NEUTRAL: 0,
  };
  bars.forEach((b) => counts[b.flowType]++);
  return counts;
}

function BreakdownRow({
  icon, label, count, total, color, textColor,
}: {
  icon: ReactNode;
  label: string;
  count: number;
  total: number;
  color: string;
  textColor: string;
}) {
  const pct = Math.round((count / total) * 100);
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className={`flex items-center gap-1 ${textColor}`}>{icon}{label}</span>
        <span className="text-muted-foreground font-mono">{count} วัน</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-2 w-2 rounded-sm ${color} opacity-80`} />
      {label}
    </span>
  );
}
