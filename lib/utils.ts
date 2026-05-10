import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, decimals = 2): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCompact(value: number): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  if (Number.isNaN(value) || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function classifyPE(pe: number): {
  label: string;
  color: "bull" | "neutral" | "bear";
  description: string;
} {
  if (!Number.isFinite(pe) || pe <= 0) {
    return {
      label: "ขาดทุน / N/A",
      color: "bear",
      description: "บริษัทยังไม่มีกำไรหรือข้อมูลไม่พร้อม",
    };
  }
  if (pe < 15) {
    return {
      label: "ถูก",
      color: "bull",
      description: "P/E ต่ำกว่าค่าเฉลี่ยตลาด อาจเป็น value stock",
    };
  }
  if (pe < 25) {
    return {
      label: "เหมาะสม",
      color: "neutral",
      description: "P/E ใกล้เคียงค่าเฉลี่ย S&P 500",
    };
  }
  if (pe < 40) {
    return {
      label: "ค่อนข้างแพง",
      color: "neutral",
      description: "P/E สูง อาจสะท้อนการเติบโตหรือฟองสบู่",
    };
  }
  return {
    label: "แพงมาก",
    color: "bear",
    description: "P/E สูงเกินค่าเฉลี่ย ต้องระวังความผันผวน",
  };
}
