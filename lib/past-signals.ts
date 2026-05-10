import type { Candle } from "@/types/stock";
import { ema, rsi } from "./indicators";

export type PastSignal = {
  time: string;
  type: "BUY" | "SELL";
  price: number;
};

/**
 * Detect historical buy/sell crossovers using two simple rules:
 *  - BUY  when EMA12 crosses above EMA26 AND RSI is below 70
 *  - SELL when EMA12 crosses below EMA26 AND RSI is above 30
 * Returns at most the last 12 events (older signals are pruned for clarity).
 */
export function detectPastSignals(candles: Candle[], limit = 12): PastSignal[] {
  if (candles.length < 30) return [];
  const closes = candles.map((c) => c.close);
  const emaFast = ema(closes, 12);
  const emaSlow = ema(closes, 26);
  const rsiArr = rsi(closes, 14);

  const out: PastSignal[] = [];
  for (let i = 1; i < candles.length; i++) {
    const f = emaFast[i];
    const s = emaSlow[i];
    const fp = emaFast[i - 1];
    const sp = emaSlow[i - 1];
    const r = rsiArr[i];
    if (f === null || s === null || fp === null || sp === null || r === null)
      continue;
    if (fp <= sp && f > s && r < 70) {
      out.push({ time: candles[i].time, type: "BUY", price: candles[i].close });
    } else if (fp >= sp && f < s && r > 30) {
      out.push({ time: candles[i].time, type: "SELL", price: candles[i].close });
    }
  }
  return out.slice(-limit);
}
