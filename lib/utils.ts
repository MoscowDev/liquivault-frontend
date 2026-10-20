import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STROOP_DECIMALS = 10_000_000;

/**
 * Formats a USDC amount (in stroops or decimal units) as a currency string.
 * @param amount Amount in USDC decimal units (or stroops if `fromStroops` is true)
 * @param fromStroops Whether the input is in 7-decimal stroops
 */
export function formatUSDC(
  amount: number | bigint | string,
  fromStroops: boolean = false
): string {
  const numericValue =
    typeof amount === "bigint"
      ? Number(amount)
      : typeof amount === "string"
      ? parseFloat(amount)
      : amount;

  if (Number.isNaN(numericValue)) return "$0.00";

  const value = fromStroops ? numericValue / STROOP_DECIMALS : numericValue;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats basis points (e.g., 145 bps -> "1.45%").
 */
export function formatBps(bps: number): string {
  const percentage = bps / 100;
  return `${percentage.toFixed(2)}%`;
}

/**
 * Truncates a Stellar G... or C... address for clean display.
 */
export function formatAddress(address: string, chars: number = 6): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Formats a UNIX timestamp (seconds) or ISO string into a readable institutional date.
 */
export function formatDate(timestampOrIso: number | string): string {
  const date =
    typeof timestampOrIso === "number"
      ? new Date(timestampOrIso * 1000)
      : new Date(timestampOrIso);
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/**
 * Computes days remaining from now until a target UNIX timestamp (in seconds).
 */
export function getDaysToMaturity(maturityTimestampSec: number): number {
  const nowSec = Math.floor(Date.now() / 1000);
  const diffSec = Math.max(0, maturityTimestampSec - nowSec);
  return Math.max(1, Math.ceil(diffSec / 86400));
}

/**
 * Generates a deterministic-looking SHA-256 hex digest from invoice metadata fields.
 */
export async function generateInvoiceMetadataHash(payload: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback deterministic hex string for test environments without SubtleCrypto
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash).toString(16).padStart(8, "0");
  return seed.repeat(8).slice(0, 64);
}
