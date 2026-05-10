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

export const metadata: Metadata = {
  title: "JTL Stock Trading — วิเคราะห์หุ้น US",
  description:
    "วิเคราะห์หุ้นอเมริกาแบบ Real-time พร้อมแนวรับแนวต้าน Smart Money วิเคราะห์รายใหญ่รายย่อย",
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
