# StockSense — เว็บวิเคราะห์หุ้นอเมริกา

วิเคราะห์หุ้นในตลาด US (NYSE/NASDAQ) ด้วย Technical Indicators แบบ multi-factor พร้อมจุดเข้าซื้อ Stop Loss เป้าหมายทำกำไร แนวรับ-แนวต้าน และข้อมูลพื้นฐานบริษัท

## Features

- **Stock Search & Analyze** — ค้นหา ticker (เช่น NVDA, AAPL) ดูกราฟแท่งเทียนพร้อมเส้น SMA, แนวรับ-แนวต้าน, Entry/Stop/Targets
- **Multi-Factor Signal** — รวมสัญญาณจาก RSI, MACD, SMA, Bollinger, momentum trend
- **Daily Recommendations** — Top Gainers, Most Active, Top Losers
- **Watchlist + Alert** — บันทึกหุ้นที่ติดตาม + แจ้งเตือนสัญญาณซื้อ-ขาย
- **Portfolio Tracker** — บันทึกการซื้อ-ขาย คำนวณ P&L
- **Mobile responsive** — ทำงานได้ดีบนทั้งมือถือและ desktop

## Setup

1. ติดตั้ง dependencies
   ```bash
   npm install
   ```

2. ขอ Alpha Vantage API key ฟรีที่ https://www.alphavantage.co/support/#api-key

3. คัดลอก `.env.local.example` เป็น `.env.local` แล้วใส่ API key
   ```env
   ALPHA_VANTAGE_API_KEY=your_actual_key_here
   ```

4. รันโปรเจกต์
   ```bash
   npm run dev
   ```

   เปิด http://localhost:3000

## API Quota

Alpha Vantage Free tier มีจำกัด **25 calls/day** — แอปนี้ cache ทุกการเรียก:
- Daily candles: 6 ชั่วโมง
- Quote: 1 ชั่วโมง
- Company overview: 24 ชั่วโมง
- Top movers: 2 ชั่วโมง
- Search: 24 ชั่วโมง

ถ้าใช้เยอะอาจอัปเกรดเป็น Premium ($49.99/เดือน — 75 calls/นาที)

## Tech Stack

- **Next.js 15** (App Router) + React 19
- **TailwindCSS** + shadcn/ui-style components
- **lightweight-charts** (TradingView) สำหรับกราฟ
- **Alpha Vantage API** สำหรับข้อมูลหุ้น

## โครงสร้างไฟล์

```
app/
├── api/                 # API routes (proxy + cache Alpha Vantage)
├── stock/[symbol]/      # หน้าวิเคราะห์รายตัว
├── watchlist/           # หน้า Watchlist
├── portfolio/           # หน้า Portfolio Tracker
└── page.tsx             # Dashboard

lib/
├── alpha-vantage.ts     # API client + caching
├── indicators.ts        # RSI, MACD, SMA, EMA, Bollinger, ATR, S/R
└── analysis.ts          # Multi-factor signal engine

components/
├── stock-chart.tsx      # TradingView candlestick + lines
├── analysis-card.tsx    # ป้ายสัญญาณ + เหตุผล
├── overview-card.tsx    # ข้อมูลพื้นฐานบริษัท + PE classification
└── recommendations.tsx  # การ์ดหุ้นแนะนำ
```

## Disclaimer

เว็บไซต์นี้ใช้สำหรับการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน ผู้ใช้ควรศึกษาและพิจารณาความเสี่ยงก่อนตัดสินใจซื้อ-ขายหุ้นทุกครั้ง
