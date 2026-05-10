"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Home, Star, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "หน้าแรก", icon: Home },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/popular", label: "Popular", icon: TrendingUp },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-background/60 backdrop-blur-3xl">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, hsl(224 71% 4% / 0.9) 0%, hsl(224 71% 4% / 0.6) 100%)",
        }}
      />
      <div className="container relative flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-105"
            style={{
              background:
                "linear-gradient(135deg, hsl(142 76% 48% / 0.2) 0%, hsl(217 91% 60% / 0.15) 100%)",
              boxShadow: "0 0 20px hsl(142 76% 48% / 0.2), inset 0 1px 0 hsl(210 40% 98% / 0.1)",
              border: "1px solid hsl(142 76% 48% / 0.25)",
            }}
          >
            <BarChart3 className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight">
              <span className="text-primary">JTL</span>
              <span className="text-foreground"> Stock</span>
            </span>
            <span className="text-[9px] text-muted-foreground tracking-widest uppercase">
              Trading
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 rounded-2xl p-1" style={{
          background: "hsl(224 71% 4% / 0.6)",
          border: "1px solid hsl(210 40% 98% / 0.06)",
          backdropFilter: "blur(20px)",
        }}>
          {items.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-1.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "text-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
                style={active ? {
                  background: "linear-gradient(135deg, hsl(217 33% 15%) 0%, hsl(217 33% 12%) 100%)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4), 0 1px 0 hsl(210 40% 98% / 0.06) inset",
                } : {}}
              >
                <it.icon className={cn("h-4 w-4", active && "text-primary")} />
                {it.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden flex border-t border-white/[0.04]">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <it.icon className="h-5 w-5" />
              {it.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
