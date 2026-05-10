import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@/lib/yahoo-finance";

export const revalidate = 14400;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await context.params;
  try {
    const items = await getNews(symbol.toUpperCase(), 10);
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
