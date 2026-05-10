import { NextRequest, NextResponse } from "next/server";
import { getOverview } from "@/lib/yahoo-finance";

export const revalidate = 86400;

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await context.params;
  try {
    const data = await getOverview(symbol.toUpperCase());
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
