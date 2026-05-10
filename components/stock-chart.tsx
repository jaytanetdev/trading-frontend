"use client";

import { useEffect, useRef } from "react";
import {
  ColorType,
  createChart,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";
import type { Candle, PrepZone, StockAnalysis } from "@/types/stock";
import type { PastSignal } from "@/lib/past-signals";
import type { SmartMoneyBar } from "@/lib/smart-money";

const FLOW_COLOR: Record<string, string> = {
  SMART_BUY:   "rgba(34, 197, 94, 0.92)",
  SMART_SELL:  "rgba(239, 68, 68, 0.92)",
  RETAIL_BUY:  "rgba(59, 130, 246, 0.80)",
  RETAIL_SELL: "rgba(249, 115, 22, 0.80)",
  PROGRAM:     "rgba(234, 179, 8, 0.92)",
  NEUTRAL:     "rgba(100, 116, 139, 0.35)",
};

type Props = {
  candles: Candle[];
  analysis: StockAnalysis | null;
  pastSignals?: PastSignal[];
  prepZones?: PrepZone[];
  smartMoneyBars?: SmartMoneyBar[];
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  height?: number;
};

export function StockChart({
  candles,
  analysis,
  pastSignals = [],
  prepZones = [],
  smartMoneyBars = [],
  fiftyTwoWeekHigh,
  fiftyTwoWeekLow,
  height = 560,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;

    const hasSmartMoney = smartMoneyBars.length > 0;

    const chart = createChart(el, {
      width: el.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
        fontFamily: "inherit",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.05)" },
        horzLines: { color: "rgba(148, 163, 184, 0.05)" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.1)",
        // leave room at bottom for volume strip + smart money panel
        scaleMargins: { top: 0.05, bottom: hasSmartMoney ? 0.40 : 0.22 },
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.1)",
        timeVisible: false,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(34, 197, 94, 0.4)", width: 1, style: LineStyle.Dashed },
        horzLine: { color: "rgba(34, 197, 94, 0.4)", width: 1, style: LineStyle.Dashed },
      },
    });
    chartRef.current = chart;

    // ── Candle series ───────────────────────────────────────────────────────
    const candleSeries: ISeriesApi<"Candlestick"> = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    candleSeries.setData(
      candles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }))
    );

    // ── Markers: past signals + prep zones (sorted ascending) ────────────
    {
      const markers: SeriesMarker<Time>[] = [];
      for (const s of pastSignals) {
        markers.push({
          time: s.time as Time,
          position: s.type === "BUY" ? "belowBar" : "aboveBar",
          color: s.type === "BUY" ? "#22c55e" : "#ef4444",
          shape: s.type === "BUY" ? "arrowUp" : "arrowDown",
          text: s.type === "BUY" ? "B" : "S",
        });
      }
      for (const z of prepZones) {
        markers.push({
          time: z.time as Time,
          position: z.type === "PREP_SELL" ? "aboveBar" : "belowBar",
          color: z.type === "PREP_SELL" ? "#f97316" : "#06b6d4",
          shape: "circle",
          text: z.type === "PREP_SELL" ? "⚠ขาย" : "⚡รับ",
        });
      }
      markers.sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
      if (markers.length) candleSeries.setMarkers(markers);
    }

    // ── Volume strip ────────────────────────────────────────────────────────
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: hasSmartMoney
        ? { top: 0.72, bottom: 0.26 }
        : { top: 0.85, bottom: 0 },
      visible: false,
    });
    volumeSeries.setData(
      candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)",
      }))
    );

    // ── Smart Money Flow panel ──────────────────────────────────────────────
    if (hasSmartMoney) {
      // Series 1 — Retail background (always shown)
      const retailSeries = chart.addHistogramSeries({
        priceFormat: { type: "price", precision: 1, minMove: 0.1 },
        priceScaleId: "smartflow",
      });
      chart.priceScale("smartflow").applyOptions({
        scaleMargins: { top: 0.84, bottom: 0 },
        visible: false,
      });

      retailSeries.setData(
        smartMoneyBars.map((b) => {
          const isUp = b.flowType === "SMART_BUY" || b.flowType === "RETAIL_BUY" || b.flowType === "NEUTRAL";
          return {
            time: b.time as Time,
            value: Math.max(0.1, b.retailValue),
            color: isUp ? "rgba(59,130,246,0.30)" : "rgba(249,115,22,0.30)",
          };
        })
      );

      // Series 2 — Smart money overlay (only when smartValue > 0)
      const smSeries = chart.addHistogramSeries({
        priceFormat: { type: "price", precision: 1, minMove: 0.1 },
        priceScaleId: "smartflow",
      });

      smSeries.setData(
        smartMoneyBars
          .filter((b) => b.smartValue > 0)
          .map((b) => ({
            time: b.time as Time,
            value: b.smartValue,
            color: FLOW_COLOR[b.flowType] ?? FLOW_COLOR.NEUTRAL,
          }))
      );
    }

    // ── 52W lines ──────────────────────────────────────────────────────────
    if (fiftyTwoWeekHigh && Number.isFinite(fiftyTwoWeekHigh)) {
      candleSeries.createPriceLine({
        price: fiftyTwoWeekHigh,
        color: "rgba(244, 63, 94, 0.5)",
        lineWidth: 1,
        lineStyle: LineStyle.LargeDashed,
        axisLabelVisible: true,
        title: "สูงสุด 52 สัปดาห์",
      });
    }
    if (fiftyTwoWeekLow && Number.isFinite(fiftyTwoWeekLow)) {
      candleSeries.createPriceLine({
        price: fiftyTwoWeekLow,
        color: "rgba(34, 197, 94, 0.5)",
        lineWidth: 1,
        lineStyle: LineStyle.LargeDashed,
        axisLabelVisible: true,
        title: "ต่ำสุด 52 สัปดาห์",
      });
    }

    // ── Analysis overlays ──────────────────────────────────────────────────
    if (analysis) {
      analysis.supportResistance.support.forEach((s, i) => {
        candleSeries.createPriceLine({
          price: s,
          color: "rgba(34, 197, 94, 0.7)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `แนวรับ ${i + 1}`,
        });
      });
      analysis.supportResistance.resistance.forEach((r, i) => {
        candleSeries.createPriceLine({
          price: r,
          color: "rgba(239, 68, 68, 0.7)",
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `แนวต้าน ${i + 1}`,
        });
      });
      candleSeries.createPriceLine({
        price: analysis.entry,
        color: "#3b82f6",
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: "จุดเข้า",
      });
      candleSeries.createPriceLine({
        price: analysis.stopLoss,
        color: "#f43f5e",
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: "ตัดขาดทุน",
      });
      analysis.targets.forEach((t, i) => {
        candleSeries.createPriceLine({
          price: t,
          color: "#a855f7",
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `เป้า ${i + 1}`,
        });
      });

      if (analysis.indicators.sma20 !== null) {
        const s = chart.addLineSeries({
          color: "rgba(59, 130, 246, 0.7)", lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false,
        });
        s.setData(computeSMA(candles, 20));
      }
      if (analysis.indicators.sma50 !== null) {
        const s = chart.addLineSeries({
          color: "rgba(234, 179, 8, 0.7)", lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false,
        });
        s.setData(computeSMA(candles, 50));
      }
      if (analysis.indicators.sma200 !== null && candles.length >= 200) {
        const s = chart.addLineSeries({
          color: "rgba(168, 85, 247, 0.6)", lineWidth: 1,
          priceLineVisible: false, lastValueVisible: false,
        });
        s.setData(computeSMA(candles, 200));
      }
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, analysis, pastSignals, prepZones, smartMoneyBars, fiftyTwoWeekHigh, fiftyTwoWeekLow, height]);

  return (
    <div className="relative">
      <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
      {smartMoneyBars.length > 0 && <SmartMoneyLegend height={height} />}
      <Legend />
    </div>
  );
}

function SmartMoneyLegend({ height }: { height: number }) {
  const top = Math.round(height * 0.845);
  return (
    <div
      className="absolute left-2 pointer-events-none flex flex-col gap-1"
      style={{ top }}
    >
      <span className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5">
        Smart Money Flow
      </span>
      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5">
        {[
          { color: "rgba(34,197,94,0.92)",  label: "รายใหญ่ซื้อ" },
          { color: "rgba(239,68,68,0.92)",  label: "รายใหญ่ขาย" },
          { color: "rgba(59,130,246,0.80)", label: "รายย่อยซื้อ" },
          { color: "rgba(249,115,22,0.80)", label: "รายย่อยขาย" },
          { color: "rgba(234,179,8,0.92)",  label: "โปรแกรม" },
        ].map(({ color, label }) => (
          <span key={label} className="inline-flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-[9px] text-slate-300">{label}</span>
          </span>
        ))}
        <span className="text-[9px] text-slate-500 ml-1">· สูง = volume มาก</span>
      </div>
    </div>
  );
}

function computeSMA(candles: Candle[], period: number) {
  const out: { time: Time; value: number }[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) out.push({ time: candles[i].time as Time, value: sum / period });
  }
  return out;
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      <Item color="#3b82f6" label="SMA20" />
      <Item color="#eab308" label="SMA50" />
      <Item color="#a855f7" label="SMA200" />
      <Item color="#22c55e" label="แนวรับ" dashed />
      <Item color="#ef4444" label="แนวต้าน" dashed />
      <Item color="#3b82f6" label="จุดเข้า" solid />
      <Item color="#f43f5e" label="ตัดขาดทุน" solid />
      <Item color="#a855f7" label="เป้าหมาย" dotted />
      <span className="inline-flex items-center gap-1">
        <span className="text-orange-400 font-bold">●</span> เตรียมขาย
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="text-cyan-400 font-bold">●</span> เตรียมรับ
      </span>
      <span className="inline-flex items-center gap-2 text-[10px] border-t border-white/10 pt-1 w-full">
        <b>กระแสเงิน:</b>
        <FlowDot color="rgba(34,197,94,0.9)" label="รายใหญ่ซื้อ" />
        <FlowDot color="rgba(239,68,68,0.9)" label="รายใหญ่ขาย" />
        <FlowDot color="rgba(59,130,246,0.8)" label="รายย่อยซื้อ" />
        <FlowDot color="rgba(249,115,22,0.8)" label="รายย่อยขาย" />
        <FlowDot color="rgba(234,179,8,0.9)" label="โปรแกรม/Algo" />
        <span className="text-slate-500 ml-1">· ความสูงบาร์ = ปริมาณซื้อขาย</span>
      </span>
    </div>
  );
}

function FlowDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Item({
  color,
  label,
  dashed,
  dotted,
  solid,
}: {
  color: string;
  label: string;
  dashed?: boolean;
  dotted?: boolean;
  solid?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-[2px] w-4 rounded-full"
        style={{
          backgroundColor: dashed || dotted || solid ? "transparent" : color,
          borderTop: dashed
            ? `2px dashed ${color}`
            : dotted
              ? `2px dotted ${color}`
              : solid
                ? `2px solid ${color}`
                : `2px solid ${color}`,
        }}
      />
      {label}
    </span>
  );
}
