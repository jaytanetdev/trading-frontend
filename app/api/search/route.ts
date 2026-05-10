import { NextRequest, NextResponse } from "next/server";
import { searchSymbols } from "@/lib/yahoo-finance";

export const revalidate = 86400;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q || q.length < 1) return NextResponse.json({ items: [] });
  try {
    const matches = await searchSymbols(q);
    return NextResponse.json({ items: matches.slice(0, 10) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
