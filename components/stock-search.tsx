"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/useSearch";

const POPULAR = ["NVDA", "AAPL", "TSLA", "MSFT", "AMZN", "META", "GOOGL", "AMD"];

export function StockSearch({ autoFocus = false }: { autoFocus?: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const { results: matches, loading } = useSearch(q);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (symbol: string) => {
    setOpen(false);
    setQ("");
    startTransition(() => {
      router.push(`/stock/${symbol.toUpperCase()}`);
    });
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && q) go(q);
          }}
          placeholder="ค้นหาหุ้น เช่น NVDA, AAPL, TSLA..."
          className="pl-10 h-12 text-base"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && (
        <div
          className={cn(
            "absolute left-0 right-0 top-full mt-2 z-[9999] rounded-xl border border-white/10 bg-card shadow-2xl shadow-black/40 overflow-hidden animate-fade-in"
          )}
        >
          {matches.length > 0 ? (
            <ul className="max-h-80 overflow-y-auto scrollbar-thin">
              {matches.map((m) => (
                <li key={m.symbol}>
                  <button
                    onClick={() => go(m.symbol)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{m.symbol}</span>
                        <span className="text-xs text-muted-foreground">
                          {m.region}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.name}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                ยอดนิยม
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((s) => (
                  <button
                    key={s}
                    onClick={() => go(s)}
                    className="rounded-full bg-secondary hover:bg-secondary/80 transition-colors px-3 py-1 text-xs font-medium"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
