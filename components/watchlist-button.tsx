"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/useWatchlist";

export function WatchlistButton({ symbol }: { symbol: string }) {
  const { isInWatchlist, add, remove } = useWatchlist();
  const [busy, setBusy] = useState(false);

  const active = isInWatchlist(symbol);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (active) {
        await remove(symbol);
      } else {
        await add(symbol);
      }
    } catch {
      // Silently handle errors — the UI reflects the current known state
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={busy}
      className={cn(active && "border-primary/40 text-primary")}
    >
      <Star className={cn("h-4 w-4", active && "fill-primary")} />
      {active ? "ใน Watchlist" : "เพิ่ม Watchlist"}
    </Button>
  );
}
