import type { Candle } from "@/types/stock";

export type FlowType = "SMART_BUY" | "SMART_SELL" | "RETAIL_BUY" | "RETAIL_SELL" | "PROGRAM" | "NEUTRAL";

export type SmartMoneyBar = {
  time: string;
  cmf: number | null;
  obv: number;
  buyPressure: number;
  volumeRatio: number;
  isProgram: boolean;
  flowType: FlowType;
  retailValue: number;
  smartValue: number;
};

export type SmartMoneyAnalysis = {
  cmf: number | null;
  obvTrend: "UP" | "DOWN" | "FLAT";
  dominantFlow: FlowType;
  smartMoneyScore: number;
  retailScore: number;
  programScore: number;
  recentBars: SmartMoneyBar[];
  interpretation: string;
  interpretationEn: string;
};

export function computeCMF(candles: Candle[], period = 20): (number | null)[] {
  const mfv: number[] = candles.map((c) => {
    const range = c.high - c.low;
    if (range === 0) return 0;
    const mfm = ((c.close - c.low) - (c.high - c.close)) / range;
    return mfm * c.volume;
  });

  const out: (number | null)[] = [];
  let sumMfv = 0;
  let sumVol = 0;

  for (let i = 0; i < candles.length; i++) {
    sumMfv += mfv[i];
    sumVol += candles[i].volume;
    if (i >= period) {
      sumMfv -= mfv[i - period];
      sumVol -= candles[i - period].volume;
    }
    out.push(i >= period - 1 && sumVol > 0 ? sumMfv / sumVol : null);
  }
  return out;
}

export function computeOBV(candles: Candle[]): number[] {
  const out: number[] = [0];
  for (let i = 1; i < candles.length; i++) {
    const prev = out[i - 1];
    if (candles[i].close > candles[i - 1].close) out.push(prev + candles[i].volume);
    else if (candles[i].close < candles[i - 1].close) out.push(prev - candles[i].volume);
    else out.push(prev);
  }
  return out;
}

/**
 * Classify every candle for the per-bar chart panel.
 * Uses rolling 20-period averages so early bars are still classified.
 */
export function classifyBars(candles: Candle[], period = 20): SmartMoneyBar[] {
  const cmfArr = computeCMF(candles, period);
  const obvArr = computeOBV(candles);

  let sumVol = 0;
  let sumRange = 0;
  const rollingAvgVol: number[] = [];
  const rollingAvgRange: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    sumVol += candles[i].volume;
    sumRange += candles[i].high - candles[i].low;
    if (i >= period) {
      sumVol -= candles[i - period].volume;
      sumRange -= candles[i - period].high - candles[i - period].low;
    }
    const n = Math.min(i + 1, period);
    rollingAvgVol.push(sumVol / n);
    rollingAvgRange.push(sumRange / n);
  }

  return candles.map((c, i) => {
    const avgVolume = rollingAvgVol[i];
    const avgRange = rollingAvgRange[i];
    const range = c.high - c.low;
    const buyPressure = range === 0 ? 0.5 : (c.close - c.low) / range;
    const volumeRatio = avgVolume > 0 ? c.volume / avgVolume : 1;
    const isProgram = volumeRatio > 3 && range < 0.5 * avgRange;

    let flowType: FlowType = "NEUTRAL";
    if (isProgram) {
      flowType = "PROGRAM";
    } else if (volumeRatio > 1.8) {
      if (buyPressure >= 0.65) flowType = "SMART_BUY";
      else if (buyPressure <= 0.35) flowType = "SMART_SELL";
      else flowType = "NEUTRAL";
    } else {
      flowType = c.close >= c.open ? "RETAIL_BUY" : "RETAIL_SELL";
    }

    const retailValue = Math.min(volumeRatio, 2.0);
    const smartValue = (flowType === "SMART_BUY" || flowType === "SMART_SELL" || flowType === "PROGRAM")
      ? Math.max(0, volumeRatio - 1.0)
      : 0;

    return {
      time: c.time,
      cmf: cmfArr[i],
      obv: obvArr[i],
      buyPressure,
      volumeRatio,
      isProgram,
      flowType,
      retailValue,
      smartValue,
    };
  });
}

export function detectSmartMoney(candles: Candle[]): SmartMoneyAnalysis | null {
  if (candles.length < 30) return null;

  const cmfArr = computeCMF(candles, 20);
  const obvArr = computeOBV(candles);

  const lookback = Math.min(20, candles.length);
  const recentCandles = candles.slice(-lookback);
  const avgVolume = recentCandles.reduce((s, c) => s + c.volume, 0) / lookback;
  const avgRange = recentCandles.reduce((s, c) => s + (c.high - c.low), 0) / lookback;

  const recentBars: SmartMoneyBar[] = recentCandles.map((c, i) => {
    const idx = candles.length - lookback + i;
    const cmf = cmfArr[idx];
    const obv = obvArr[idx];
    const range = c.high - c.low;
    const buyPressure = range === 0 ? 0.5 : (c.close - c.low) / range;
    const volumeRatio = avgVolume > 0 ? c.volume / avgVolume : 1;
    const isProgram = volumeRatio > 3 && range < 0.5 * avgRange;

    let flowType: FlowType = "NEUTRAL";
    if (isProgram) {
      flowType = "PROGRAM";
    } else if (volumeRatio > 1.8) {
      // High volume — institutional activity
      if (buyPressure >= 0.65) flowType = "SMART_BUY";
      else if (buyPressure <= 0.35) flowType = "SMART_SELL";
      else flowType = "NEUTRAL";
    } else if (volumeRatio < 0.7) {
      // Low volume — retail drifting
      flowType = c.close >= c.open ? "RETAIL_BUY" : "RETAIL_SELL";
    } else {
      flowType = c.close >= c.open ? "RETAIL_BUY" : "RETAIL_SELL";
    }

    const retailValue = Math.min(volumeRatio, 2.0);
    const smartValue = (flowType === "SMART_BUY" || flowType === "SMART_SELL" || flowType === "PROGRAM")
      ? Math.max(0, volumeRatio - 1.0)
      : 0;

    return { time: c.time, cmf, obv, buyPressure, volumeRatio, isProgram, flowType, retailValue, smartValue };
  });

  const latestCmf = cmfArr[cmfArr.length - 1];
  const obvCurrent = obvArr[obvArr.length - 1];
  const obv10Ago = obvArr[Math.max(0, obvArr.length - 11)];
  const obvTrend: "UP" | "DOWN" | "FLAT" =
    obvCurrent > obv10Ago * 1.03 ? "UP" : obvCurrent < obv10Ago * 0.97 ? "DOWN" : "FLAT";

  const smartBuyCount = recentBars.filter((b) => b.flowType === "SMART_BUY").length;
  const smartSellCount = recentBars.filter((b) => b.flowType === "SMART_SELL").length;
  const programCount = recentBars.filter((b) => b.flowType === "PROGRAM").length;
  const retailBuyCount = recentBars.filter((b) => b.flowType === "RETAIL_BUY").length;
  const retailSellCount = recentBars.filter((b) => b.flowType === "RETAIL_SELL").length;

  const smartMoneyScore = Math.round(((smartBuyCount - smartSellCount) / lookback) * 100);
  const retailScore = Math.round(((retailBuyCount + retailSellCount) / lookback) * 100);
  const programScore = Math.round((programCount / lookback) * 100);

  const lastBar = recentBars[recentBars.length - 1];
  let dominantFlow: FlowType = "NEUTRAL";

  if (lastBar.isProgram || programCount >= 3) {
    dominantFlow = "PROGRAM";
  } else if (smartBuyCount >= 3 && smartBuyCount > smartSellCount) {
    dominantFlow = "SMART_BUY";
  } else if (smartSellCount >= 3 && smartSellCount > smartBuyCount) {
    dominantFlow = "SMART_SELL";
  } else if (retailBuyCount > retailSellCount && obvTrend === "UP") {
    dominantFlow = "RETAIL_BUY";
  } else if (retailSellCount > retailBuyCount && obvTrend === "DOWN") {
    dominantFlow = "RETAIL_SELL";
  }

  const interpretations: Record<FlowType, { th: string; en: string }> = {
    SMART_BUY:   { th: "รายใหญ่กำลังสะสม — มีโอกาสราคาขึ้นต่อ", en: "Institutional Accumulation" },
    SMART_SELL:  { th: "รายใหญ่กำลังปล่อยของ — ระวังราคาร่วง", en: "Institutional Distribution" },
    RETAIL_BUY:  { th: "รายย่อยซื้อตามโมเมนตัม — ระวัง FOMO", en: "Retail Momentum Buy" },
    RETAIL_SELL: { th: "รายย่อยขาย/ตื่นตระหนก — อาจเป็นจุดรับ", en: "Retail Panic Sell" },
    PROGRAM:     { th: "พบสัญญาณ Program/Algo Trading — วอลุ่มผิดปกติ", en: "Program / Algo Trading Detected" },
    NEUTRAL:     { th: "ยังไม่มีทิศทางชัดเจน — รอสัญญาณยืนยัน", en: "No Clear Directional Bias" },
  };

  return {
    cmf: latestCmf,
    obvTrend,
    dominantFlow,
    smartMoneyScore,
    retailScore,
    programScore,
    recentBars,
    interpretation: interpretations[dominantFlow].th,
    interpretationEn: interpretations[dominantFlow].en,
  };
}
