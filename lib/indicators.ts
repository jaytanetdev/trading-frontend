import type { Candle, IndicatorSnapshot, PrepZone, SupportResistance } from "@/types/stock";

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      sum += values[i];
      out.push(null);
    } else if (i === period - 1) {
      sum += values[i];
      prev = sum / period;
      out.push(prev);
    } else {
      prev = values[i] * k + (prev as number) * (1 - k);
      out.push(prev);
    }
  }
  return out;
}

export function rsi(values: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = [null];
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (i <= period) {
      if (diff > 0) gain += diff;
      else loss -= diff;
      if (i === period) {
        const avgGain = gain / period;
        const avgLoss = loss / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        out.push(100 - 100 / (1 + rs));
      } else {
        out.push(null);
      }
    } else {
      const prevAvgGain =
        (gain / period) * (period - 1) / period + (diff > 0 ? diff / period : 0);
      const prevAvgLoss =
        (loss / period) * (period - 1) / period + (diff < 0 ? -diff / period : 0);
      gain = prevAvgGain * period;
      loss = prevAvgLoss * period;
      const rs = prevAvgLoss === 0 ? 100 : prevAvgGain / prevAvgLoss;
      out.push(100 - 100 / (1 + rs));
    }
  }
  return out;
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine = emaFast.map((v, i) => {
    const s = emaSlow[i];
    return v !== null && s !== null ? v - s : null;
  });
  const cleaned = macdLine.map((v) => (v === null ? 0 : v));
  const signalLine = ema(cleaned, signal).map((v, i) =>
    macdLine[i] === null ? null : v
  );
  const hist = macdLine.map((m, i) => {
    const s = signalLine[i];
    return m !== null && s !== null ? m - s : null;
  });
  return { macdLine, signalLine, hist };
}

export function bollinger(values: number[], period = 20, stdDev = 2) {
  const middle = sma(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    const slice = values.slice(i - period + 1, i + 1);
    const mean = (middle[i] as number);
    const variance =
      slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    upper.push(mean + stdDev * sd);
    lower.push(mean - stdDev * sd);
  }
  return { upper, middle, lower };
}

export function atr(candles: Candle[], period = 14): (number | null)[] {
  const trs: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trs.push(candles[i].high - candles[i].low);
      continue;
    }
    const prev = candles[i - 1].close;
    const tr = Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - prev),
      Math.abs(candles[i].low - prev)
    );
    trs.push(tr);
  }
  return ema(trs, period);
}

export function pivotPoints(candle: Candle): SupportResistance {
  const { high, low, close } = candle;
  const pivot = (high + low + close) / 3;
  const r1 = 2 * pivot - low;
  const s1 = 2 * pivot - high;
  const r2 = pivot + (high - low);
  const s2 = pivot - (high - low);
  return { support: [], resistance: [], pivot, r1, r2, s1, s2 };
}

/**
 * Detect significant swing highs and lows by checking local extremes
 * over a configurable lookback window. Levels are then clustered so
 * nearby touches collapse into a single support/resistance line.
 */
export function detectSupportResistance(
  candles: Candle[],
  lookback = 5,
  clusterTolerancePct = 0.015
): { support: number[]; resistance: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    let isHigh = true;
    let isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i].high <= candles[i - j].high) isHigh = false;
      if (candles[i].high <= candles[i + j].high) isHigh = false;
      if (candles[i].low >= candles[i - j].low) isLow = false;
      if (candles[i].low >= candles[i + j].low) isLow = false;
    }
    if (isHigh) highs.push(candles[i].high);
    if (isLow) lows.push(candles[i].low);
  }

  const cluster = (levels: number[]): number[] => {
    if (!levels.length) return [];
    const sorted = [...levels].sort((a, b) => a - b);
    const out: number[] = [];
    let bucket: number[] = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      const avg = bucket.reduce((a, b) => a + b, 0) / bucket.length;
      if (Math.abs(sorted[i] - avg) / avg <= clusterTolerancePct) {
        bucket.push(sorted[i]);
      } else {
        out.push(bucket.reduce((a, b) => a + b, 0) / bucket.length);
        bucket = [sorted[i]];
      }
    }
    out.push(bucket.reduce((a, b) => a + b, 0) / bucket.length);
    return out;
  };

  const lastPrice = candles[candles.length - 1].close;
  const supportLevels = cluster(lows).filter((l) => l < lastPrice).slice(-3);
  const resistanceLevels = cluster(highs).filter((l) => l > lastPrice).slice(0, 3);
  return { support: supportLevels, resistance: resistanceLevels };
}

export function detectPrepZones(
  candles: Candle[],
  resistance: number[],
  support: number[],
  tolerancePct = 0.018
): PrepZone[] {
  if (candles.length < 5 || (resistance.length === 0 && support.length === 0)) return [];

  const zones: PrepZone[] = [];
  const seen = new Set<string>();

  for (let i = 5; i < candles.length; i++) {
    const c = candles[i];

    for (const level of resistance) {
      const dist = (level - c.close) / level;
      if (dist >= 0 && dist <= tolerancePct) {
        const key = `sell-${c.time}-${level.toFixed(2)}`;
        if (!seen.has(key)) {
          seen.add(key);
          zones.push({ time: c.time, type: "PREP_SELL", level, distancePct: dist });
        }
        break;
      }
    }

    for (const level of support) {
      const dist = (c.close - level) / level;
      if (dist >= 0 && dist <= tolerancePct) {
        const key = `buy-${c.time}-${level.toFixed(2)}`;
        if (!seen.has(key)) {
          seen.add(key);
          zones.push({ time: c.time, type: "PREP_BUY", level, distancePct: dist });
        }
        break;
      }
    }
  }

  return zones.slice(-20);
}

export function buildIndicatorSnapshot(candles: Candle[]): IndicatorSnapshot {
  const closes = candles.map((c) => c.close);
  const lastIdx = closes.length - 1;
  const rsiArr = rsi(closes, 14);
  const macdRes = macd(closes);
  const sma20Arr = sma(closes, 20);
  const sma50Arr = sma(closes, 50);
  const sma200Arr = sma(closes, 200);
  const ema12Arr = ema(closes, 12);
  const ema26Arr = ema(closes, 26);
  const bb = bollinger(closes, 20, 2);
  const atrArr = atr(candles, 14);

  return {
    rsi: rsiArr[lastIdx],
    macd: macdRes.macdLine[lastIdx],
    macdSignal: macdRes.signalLine[lastIdx],
    macdHist: macdRes.hist[lastIdx],
    sma20: sma20Arr[lastIdx],
    sma50: sma50Arr[lastIdx],
    sma200: sma200Arr[lastIdx],
    ema12: ema12Arr[lastIdx],
    ema26: ema26Arr[lastIdx],
    bollingerUpper: bb.upper[lastIdx],
    bollingerMiddle: bb.middle[lastIdx],
    bollingerLower: bb.lower[lastIdx],
    atr: atrArr[lastIdx],
  };
}
