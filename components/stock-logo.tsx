"use client";

import { useState } from "react";

export function StockLogo({
  symbol,
  size = 40,
  className = "",
}: {
  symbol: string;
  size?: number;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const src = `https://financialmodelingprep.com/image-stock/${symbol}.png`;

  if (errored) {
    return (
      <div
        className={`rounded-xl flex items-center justify-center font-bold text-primary shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          background:
            "linear-gradient(135deg, hsl(142 76% 48% / 0.15) 0%, hsl(217 91% 60% / 0.1) 100%)",
          border: "1px solid hsl(142 76% 48% / 0.2)",
          fontSize: size * 0.28,
        }}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      onError={() => setErrored(true)}
      className={`rounded-xl object-contain bg-white/5 shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
