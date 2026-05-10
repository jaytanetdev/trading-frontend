import { Sparkles, TrendingUp } from "lucide-react";
import { StockSearch } from "@/components/stock-search";
import { Recommendations } from "@/components/recommendations";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12 sm:py-16 gradient-border"
        style={{
          background: "linear-gradient(135deg, hsl(224 71% 5.5% / 0.95) 0%, hsl(217 33% 8% / 0.90) 50%, hsl(224 71% 5.5% / 0.95) 100%)",
          border: "1px solid hsl(210 40% 98% / 0.06)",
          boxShadow: "0 0 0 1px hsl(142 76% 48% / 0.04), 0 24px 80px hsl(224 71% 4% / 0.8), 0 1px 0 hsl(210 40% 98% / 0.05) inset",
        }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(142 76% 48% / 0.18) 0%, transparent 70%)" }}
        />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(217 91% 60% / 0.13) 0%, transparent 70%)" }}
        />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(280 80% 60% / 0.05) 0%, transparent 70%)" }}
        />

        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
            style={{
              borderColor: "hsl(142 76% 48% / 0.3)",
              background: "hsl(142 76% 48% / 0.08)",
              color: "hsl(142 76% 65%)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            วิเคราะห์ด้วย Technical Indicators แบบ Multi-Factor
          </div>

          <h1 className="mt-5 text-3xl sm:text-5xl font-bold tracking-tight leading-[1.15]">
            ตัดสินใจซื้อ-ขายหุ้นอเมริกา
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(90deg, hsl(142 76% 55%) 0%, hsl(160 70% 50%) 40%, hsl(217 91% 65%) 100%)",
              }}
            >
              ด้วยข้อมูลที่ชัดเจน
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg leading-relaxed"
            style={{ color: "hsl(215 20% 60%)" }}
          >
            กราฟพร้อมแนวรับ-แนวต้าน · จุดเข้าซื้อ · Stop Loss · เป้าหมายทำกำไร · ข้อมูลพื้นฐานบริษัท ครบในที่เดียว
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs"
            style={{ color: "hsl(215 20% 50%)" }}
          >
            {["Real-time Quote", "Smart Money Flow", "แนวรับ/แนวต้าน", "จุดเข้า & Stop Loss"].map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1"
                style={{
                  background: "hsl(217 33% 11% / 0.8)",
                  border: "1px solid hsl(210 40% 98% / 0.06)",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full"
                  style={{ background: "hsl(142 76% 48%)" }}
                />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Search bar outside overflow-hidden so dropdown renders correctly */}
      <div className="max-w-xl">
        <StockSearch autoFocus />
      </div>

      {/* Recommendations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              หุ้นน่าสนใจวันนี้
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              คัดจากหุ้นที่พุ่งแรง วอลุ่มสูง และโมเมนตัมโดดเด่นในตลาด US
            </p>
          </div>
        </div>
        <Recommendations />
      </section>
    </div>
  );
}
