import type {
  AnalysisReason,
  Candle,
  Signal,
  StockAnalysis,
} from "@/types/stock";
import {
  buildIndicatorSnapshot,
  detectSupportResistance,
  pivotPoints,
} from "./indicators";

/**
 * Multi-factor scoring engine. Each indicator can contribute a positive
 * (bullish) or negative (bearish) score with a confidence weight. The
 * aggregated score is converted into a discrete signal and entry/exit
 * levels are derived from ATR + nearest support/resistance.
 */
export function analyzeStock(candles: Candle[]): StockAnalysis | null {
  if (candles.length < 50) return null;

  const last = candles[candles.length - 1];
  const indicators = buildIndicatorSnapshot(candles);
  const sr = detectSupportResistance(candles);
  const pivot = pivotPoints(candles[candles.length - 2] ?? last);
  const supportResistance = {
    ...pivot,
    support: sr.support,
    resistance: sr.resistance,
  };

  const reasons: AnalysisReason[] = [];
  let score = 0;
  let weight = 0;

  // RSI
  if (indicators.rsi !== null) {
    weight += 1;
    if (indicators.rsi < 30) {
      score += 1;
      reasons.push({
        text: `RSI ${indicators.rsi.toFixed(1)} อยู่ในเขต Oversold — มักรีบาวน์ในระยะสั้น`,
        type: "bull",
      });
    } else if (indicators.rsi > 70) {
      score -= 1;
      reasons.push({
        text: `RSI ${indicators.rsi.toFixed(1)} อยู่ในเขต Overbought — เสี่ยงพักฐาน`,
        type: "bear",
      });
    } else if (indicators.rsi > 50) {
      score += 0.3;
      reasons.push({
        text: `RSI ${indicators.rsi.toFixed(1)} เหนือ 50 บอกถึงโมเมนตัมขาขึ้น`,
        type: "bull",
      });
    } else {
      score -= 0.3;
      reasons.push({
        text: `RSI ${indicators.rsi.toFixed(1)} ต่ำกว่า 50 โมเมนตัมยังอ่อน`,
        type: "bear",
      });
    }
  }

  // MACD
  if (indicators.macd !== null && indicators.macdSignal !== null) {
    weight += 1;
    const diff = indicators.macd - indicators.macdSignal;
    if (diff > 0 && (indicators.macdHist ?? 0) > 0) {
      score += 0.8;
      reasons.push({
        text: "MACD ตัดเส้นสัญญาณขึ้น (Bullish Crossover)",
        type: "bull",
      });
    } else if (diff < 0) {
      score -= 0.8;
      reasons.push({
        text: "MACD ต่ำกว่าเส้นสัญญาณ — ขาลง",
        type: "bear",
      });
    }
  }

  // Moving averages — golden / death cross + price location
  if (indicators.sma50 !== null && indicators.sma200 !== null) {
    weight += 1;
    if (indicators.sma50 > indicators.sma200) {
      score += 0.7;
      reasons.push({
        text: "SMA50 อยู่เหนือ SMA200 (Golden Cross context) — แนวโน้มหลักเป็นขาขึ้น",
        type: "bull",
      });
    } else {
      score -= 0.7;
      reasons.push({
        text: "SMA50 อยู่ใต้ SMA200 (Death Cross context) — แนวโน้มหลักเป็นขาลง",
        type: "bear",
      });
    }
  }

  if (indicators.sma20 !== null) {
    weight += 0.5;
    if (last.close > indicators.sma20) {
      score += 0.3;
      reasons.push({
        text: `ราคายืนเหนือ SMA20 (${indicators.sma20.toFixed(2)})`,
        type: "bull",
      });
    } else {
      score -= 0.3;
      reasons.push({
        text: `ราคาอยู่ใต้ SMA20 (${indicators.sma20.toFixed(2)})`,
        type: "bear",
      });
    }
  }

  // Bollinger
  if (
    indicators.bollingerUpper !== null &&
    indicators.bollingerLower !== null
  ) {
    weight += 0.5;
    if (last.close <= indicators.bollingerLower) {
      score += 0.5;
      reasons.push({
        text: "ราคาแตะ Lower Bollinger Band — มักรีบาวน์",
        type: "bull",
      });
    } else if (last.close >= indicators.bollingerUpper) {
      score -= 0.5;
      reasons.push({
        text: "ราคาแตะ Upper Bollinger Band — เสี่ยงย่อตัว",
        type: "bear",
      });
    }
  }

  // Trend confirmation - higher highs / higher lows over last 20 candles
  const recent = candles.slice(-20);
  const firstHalfAvg =
    recent.slice(0, 10).reduce((a, c) => a + c.close, 0) / 10;
  const secondHalfAvg =
    recent.slice(10).reduce((a, c) => a + c.close, 0) / 10;
  weight += 0.5;
  if (secondHalfAvg > firstHalfAvg * 1.02) {
    score += 0.4;
    reasons.push({
      text: "ราคาเฉลี่ย 10 วันล่าสุดสูงกว่า 10 วันก่อนหน้า > 2% — มีโมเมนตัมขาขึ้น",
      type: "bull",
    });
  } else if (secondHalfAvg < firstHalfAvg * 0.98) {
    score -= 0.4;
    reasons.push({
      text: "ราคาเฉลี่ย 10 วันล่าสุดต่ำกว่า 10 วันก่อนหน้า > 2% — โมเมนตัมขาลง",
      type: "bear",
    });
  }

  const normalized = weight === 0 ? 0 : score / weight;

  let signal: Signal = "HOLD";
  if (normalized >= 0.55) signal = "STRONG_BUY";
  else if (normalized >= 0.2) signal = "BUY";
  else if (normalized <= -0.55) signal = "STRONG_SELL";
  else if (normalized <= -0.2) signal = "SELL";

  // Entry/Stop/Targets — derive from ATR & nearest S/R
  const atr14 = indicators.atr ?? last.close * 0.02;
  const nearestSupport =
    sr.support[sr.support.length - 1] ?? last.close - atr14 * 2;
  const nearestResistance = sr.resistance[0] ?? last.close + atr14 * 2;

  let entry = last.close;
  let stopLoss = nearestSupport - atr14 * 0.5;
  let targets = [nearestResistance, nearestResistance + atr14 * 2];

  if (signal === "STRONG_BUY" || signal === "BUY") {
    // Buy on dip near nearest support, target the nearest resistance
    entry = Math.max(nearestSupport, last.close - atr14 * 0.5);
    stopLoss = nearestSupport - atr14;
    targets = [
      last.close + atr14 * 2,
      nearestResistance,
      nearestResistance + atr14 * 2,
    ];
  } else if (signal === "STRONG_SELL" || signal === "SELL") {
    entry = Math.min(nearestResistance, last.close + atr14 * 0.5);
    stopLoss = nearestResistance + atr14;
    targets = [
      last.close - atr14 * 2,
      nearestSupport,
      nearestSupport - atr14 * 2,
    ];
  }

  const reward = Math.abs(targets[0] - entry);
  const risk = Math.abs(entry - stopLoss);
  const riskReward = risk === 0 ? 0 : reward / risk;

  return {
    symbol: "",
    signal,
    score: normalized,
    confidence: Math.min(1, Math.abs(normalized) * 1.5),
    reasons,
    entry,
    stopLoss,
    targets,
    riskReward,
    supportResistance,
    indicators,
  };
}

export function signalLabel(s: Signal): { th: string; color: string } {
  switch (s) {
    case "STRONG_BUY":
      return { th: "ซื้อรอบใหญ่", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" };
    case "BUY":
      return { th: "ซื้อ", color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" };
    case "HOLD":
      return { th: "ถือ/รอ", color: "bg-amber-500/10 text-amber-300 border-amber-500/30" };
    case "SELL":
      return { th: "ขาย", color: "bg-rose-500/10 text-rose-300 border-rose-500/30" };
    case "STRONG_SELL":
      return { th: "ขายเร่งด่วน", color: "bg-rose-500/15 text-rose-400 border-rose-500/40" };
  }
}
