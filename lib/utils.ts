import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toCents(value: number | string) {
  return Math.round(Number(value) * 100);
}

export function fromCents(cents: number) {
  return cents / 100;
}

export function toPercent(discountDecimal: number) {
  return Math.round(discountDecimal * 100);
}

export function safeDate(value?: string | Date | null) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}
