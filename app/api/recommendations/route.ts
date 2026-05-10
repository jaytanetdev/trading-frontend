import { NextResponse } from "next/server";
import { getTopMovers } from "@/lib/yahoo-finance";

export const revalidate = 7200;

export async function GET() {
  try {
    const movers = await getTopMovers();
    return NextResponse.json({ items: movers });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
