"use client";

import { useMemo, useState } from "react";
import { Info, ChevronDown } from "lucide-react";
import { StockChart } from "./stock-chart";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Candle, StockAnalysis } from "@/types/stock";
import { detectPastSignals } from "@/lib/past-signals";
import { detectPrepZones } from "@/lib/indicators";
import { classifyBars } from "@/lib/smart-money";
import type { SmartMoneyBar } from "@/lib/smart-money";

const RANGES = [
  { key: "1M", days: 22 },
  { key: "3M", days: 66 },
  { key: "6M", days: 132 },
  { key: "1Y", days: 252 },
  { key: "ALL", days: Number.MAX_SAFE_INTEGER },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

export function ChartSection({
  candles,
  analysis,
  fiftyTwoWeekHigh,
  fiftyTwoWeekLow,
}: {
  candles: Candle[];
  analysis: StockAnalysis | null;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
}) {
  const [range, setRange] = useState<RangeKey>("6M");

  const visible = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)!.days;
    return candles.slice(-days);
  }, [candles, range]);

  const pastSignals = useMemo(() => detectPastSignals(visible), [visible]);

  const prepZones = useMemo(() => {
    if (!analysis) return [];
    const { support, resistance } = analysis.supportResistance;
    return detectPrepZones(visible, resistance, support);
  }, [visible, analysis]);

  const smartMoneyBars = useMemo(() => classifyBars(visible), [visible]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-full bg-secondary/40 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "px-3 py-1 text-xs rounded-full font-medium transition-colors",
                range === r.key
                  ? "bg-card text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r.key}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {fiftyTwoWeekHigh && Number.isFinite(fiftyTwoWeekHigh) && (
            <Badge variant="bear" className="text-[10px]">
              สูงสุด 52 สัปดาห์ ${fiftyTwoWeekHigh.toFixed(2)}
            </Badge>
          )}
          {fiftyTwoWeekLow && Number.isFinite(fiftyTwoWeekLow) && (
            <Badge variant="bull" className="text-[10px]">
              ต่ำสุด 52 สัปดาห์ ${fiftyTwoWeekLow.toFixed(2)}
            </Badge>
          )}
        </div>
      </div>

      <StockChart
        candles={visible}
        analysis={analysis}
        pastSignals={pastSignals}
        prepZones={prepZones}
        smartMoneyBars={smartMoneyBars}
        fiftyTwoWeekHigh={fiftyTwoWeekHigh}
        fiftyTwoWeekLow={fiftyTwoWeekLow}
        height={560}
      />

      {(pastSignals.length > 0 || prepZones.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {pastSignals.length > 0 && (
            <>
              <span className="inline-flex items-center gap-1">
                <span className="text-emerald-400">▲</span> สัญญาณซื้อย้อนหลัง
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="text-rose-400">▼</span> สัญญาณขายย้อนหลัง
              </span>
            </>
          )}
          {prepZones.length > 0 && (
            <>
              <span className="inline-flex items-center gap-1">
                <span className="text-orange-400 font-bold">●</span> เตรียมขาย (ใกล้แนวต้าน ≤1.8%)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="text-cyan-400 font-bold">●</span> เตรียมรับ (ใกล้แนวรับ ≤1.8%)
              </span>
            </>
          )}
        </div>
      )}

      <IndicatorGuide />
    </div>
  );
}

function IndicatorGuide() {
  const [open, setOpen] = useState(false);
  const items = [
    {
      symbol: "SMA20",
      color: "#3b82f6",
      title: "เส้นค่าเฉลี่ย 20 วัน (Short-term)",
      desc: "ค่าเฉลี่ยราคาปิดใน 20 วันล่าสุด (~1 เดือน) ถ้าราคาอยู่เหนือเส้นนี้ = แนวโน้มระยะสั้นเป็นขาขึ้น",
    },
    {
      symbol: "SMA50",
      color: "#eab308",
      title: "เส้นค่าเฉลี่ย 50 วัน (Medium-term)",
      desc: "ค่าเฉลี่ยราคาปิดใน 50 วันล่าสุด (~2.5 เดือน) บอกแนวโน้มระยะกลาง นักลงทุนส่วนใหญ่ดูเส้นนี้",
    },
    {
      symbol: "SMA200",
      color: "#a855f7",
      title: "เส้นค่าเฉลี่ย 200 วัน (Long-term)",
      desc: "ค่าเฉลี่ยราคาปิดใน 200 วันล่าสุด (~1 ปี) เป็นเส้นที่กองทุนใหญ่ดู ถ้า SMA50 ตัดขึ้นเหนือ SMA200 = Golden Cross (bullish มาก)",
    },
    {
      symbol: "แนวรับ",
      color: "#22c55e",
      title: "แนวรับ (Support)",
      desc: "ระดับราคาที่ในอดีตเคยตกมาแล้วมีแรงซื้อเข้ามาดันราคาขึ้น → โซนที่อาจซื้อได้",
      dashed: true,
    },
    {
      symbol: "แนวต้าน",
      color: "#ef4444",
      title: "แนวต้าน (Resistance)",
      desc: "ระดับราคาที่ในอดีตเคยขึ้นมาแล้วมีแรงขายกดราคาลง → โซนที่อาจขายหรือลด Position",
      dashed: true,
    },
    {
      symbol: "จุดเข้า",
      color: "#3b82f6",
      title: "จุดเข้า (Entry)",
      desc: "ราคาที่ระบบแนะนำให้เข้าซื้อ/ขาย คำนวณจากแนวรับ/แนวต้านและความผันผวน (ATR)",
      solid: true,
    },
    {
      symbol: "ตัดขาดทุน",
      color: "#f43f5e",
      title: "ตัดขาดทุน (Stop Loss)",
      desc: "ถ้าราคาหลุดระดับนี้ = สัญญาณผิด ควรออก เพื่อจำกัดความเสียหาย ห้าม 'ขยับ' ลงอีก",
      solid: true,
    },
    {
      symbol: "เป้าหมาย",
      color: "#a855f7",
      title: "เป้าหมายทำกำไร (Take Profit)",
      desc: "ระดับที่คาดว่าราคาจะไปถึง คำนวณจากแนวต้านถัดไปและ 2×ATR มี 2-3 เป้าให้ทยอยขาย",
      dotted: true,
    },
  ];

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Info className="h-3.5 w-3.5 text-primary/70" />
        <span>คำอธิบายสัญลักษณ์บนกราฟ (สำหรับมือใหม่)</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 rounded-2xl border border-white/5 bg-secondary/20 backdrop-blur-sm p-4 grid gap-3 sm:grid-cols-2 animate-fade-in">
          {items.map((it) => (
            <div key={it.symbol} className="flex gap-3 items-start">
              <div className="mt-1 shrink-0 h-3 w-5 rounded-sm" style={{
                background: it.solid ? it.color :
                  it.dashed ? "transparent" : it.dotted ? "transparent" : it.color,
                borderTop: it.dashed ? `2px dashed ${it.color}` :
                  it.dotted ? `2px dotted ${it.color}` :
                  it.solid ? `2px solid ${it.color}` : undefined,
              }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: it.color }}>{it.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
