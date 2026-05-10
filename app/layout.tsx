import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

const BASE_URL = "https://stock-analysis.techhousesoft.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "JTL Stock — วิเคราะห์หุ้น US",
    template: "%s | JTL Stock",
  },
  description:
    "วิเคราะห์หุ้นอเมริกาแบบ Real-time พร้อมแนวรับแนวต้าน Smart Money วิเคราะห์รายใหญ่รายย่อย จุดเข้าซื้อ Stop Loss เป้าทำกำไร",
  keywords: [
    "วิเคราะห์หุ้น", "หุ้นอเมริกา", "หุ้น US", "US stock analysis",
    "แนวรับแนวต้าน", "Smart Money", "เทคนิคัล", "technical analysis",
    "จุดเข้าซื้อ", "Stop Loss", "stock chart", "AAPL", "TSLA", "NVDA",
  ],
  authors: [{ name: "JTL Stock" }],
  creator: "JTL Stock",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: BASE_URL,
    siteName: "JTL Stock Analysis",
    title: "JTL Stock — วิเคราะห์หุ้น US",
    description:
      "วิเคราะห์หุ้นอเมริกาแบบ Real-time พร้อมแนวรับแนวต้าน Smart Money จุดเข้าซื้อ Stop Loss",
  },
  twitter: {
    card: "summary_large_image",
    title: "JTL Stock — วิเคราะห์หุ้น US",
    description:
      "วิเคราะห์หุ้นอเมริกาแบบ Real-time พร้อมแนวรับแนวต้าน Smart Money",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0f1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body className="min-h-screen gradient-mesh">
        <Nav />
        <main className="container py-6 sm:py-10 animate-fade-in">
          {children}
        </main>
      </body>
    </html>
  );
}
