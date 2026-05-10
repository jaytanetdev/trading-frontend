import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Popular Stocks — หุ้นถูก Watch มากที่สุด",
  description:
    "ดูหุ้น US ที่คนสนใจมากที่สุด ติดตาม Watchlist บ่อยที่สุดในชุมชน อัพเดท Real-time",
  alternates: {
    canonical: "/popular",
  },
};

export default function PopularLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
