import { NextRequest, NextResponse } from "next/server";
import { getDailyCandles, getQuote } from "@/lib/yahoo-finance";
import { analyzeStock } from "@/lib/analysis";

export const revalidate = 3600;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await context.params;
  const upper = symbol.toUpperCase();
  try {
    const [candles, quote] = await Promise.all([
      getDailyCandles(upper),
      getQuote(upper),
    ]);

    if (!candles.length) {
      return NextResponse.json(
        { error: `No data for ${upper}` },
        { status: 404 }
      );
    }

    const analysis = analyzeStock(candles);
    if (analysis) analysis.symbol = upper;

    return NextResponse.json({
      symbol: upper,
      candles: candles.slice(-365),
      quote,
      analysis,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
