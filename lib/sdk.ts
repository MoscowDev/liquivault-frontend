import { getDaysToMaturity } from "./utils";

export type RiskTier = "Tier A" | "Tier B" | "Tier C";
export type InvoiceStatus = "Issued" | "Verified" | "Factored" | "Settled" | "Defaulted";

export interface UIInvoice {
  id: number;
  invoiceRef: string;
  merchantAddress: string;
  debtorName: string;
  debtorAddress: string;
  amountUsdc: number;
  maturityTimestamp: number;
  riskTier: RiskTier;
  metadataHash: string;
  status: InvoiceStatus;
  escrowId?: number;
  netPayoutUsdc?: number;
  discountBps?: number;
  txHash: string;
}

export interface UIProtocolTransaction {
  id: string;
  type: "MINT_INVOICE" | "FACTOR_INVOICE" | "SETTLE_ESCROW" | "LP_DEPOSIT" | "LP_WITHDRAW";
  invoiceId?: number;
  actor: string;
  amountUsdc: number;
  timestamp: string;
  txHash: string;
  status: "SUCCESS" | "FINALIZED";
}

export interface UIPoolMetrics {
  totalLiquidityUsdc: number;
  utilizedLiquidityUsdc: number;
  availableLiquidityUsdc: number;
  totalFactoredVolumeUsdc: number;
  protocolFeeReserveUsdc: number;
  totalLpShares: number;
  sharePriceUsdc: number;
  currentApyBps: number;
  activeEscrowsCount: number;
  defaultRateBps: number;
}

export interface DiscountQuote {
  faceValueUsdc: number;
  daysToMaturity: number;
  riskTier: RiskTier;
  annualizedRateBps: number;
  effectiveDiscountBps: number;
  totalDiscountUsdc: number;
  protocolFeeUsdc: number;
  lpYieldUsdc: number;
  netPayoutUsdc: number;
}

export const STELLAR_CONFIG = {
  network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET",
  rpcUrl: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
  horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org",
  networkPassphrase:
    process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015",
  contracts: {
    invoiceAsset:
      process.env.NEXT_PUBLIC_INVOICE_ASSET_CONTRACT_ID ||
      "CBZ7LQV2INV4ASSET7SOROBAN3CONTRACT8TESTNET9ID00000001",
    liquidityPool:
      process.env.NEXT_PUBLIC_LIQUIDITY_POOL_CONTRACT_ID ||
      "CCX9LQVP3POOL6VAULT2SOROBAN8CONTRACT4TESTNET9ID000002",
    escrowRouting:
      process.env.NEXT_PUBLIC_ESCROW_ROUTING_CONTRACT_ID ||
      "CDY4LQVE8ESCROW5ROUTER1SOROBAN7CONTRACT2TESTNET9ID003",
    usdcToken:
      process.env.NEXT_PUBLIC_USDC_TOKEN_CONTRACT_ID ||
      "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  },
  anchor: {
    authEndpoint:
      process.env.NEXT_PUBLIC_ANCHOR_AUTH_ENDPOINT || "https://anchor.liquivault.finance/auth",
    homeDomain: process.env.NEXT_PUBLIC_ANCHOR_HOME_DOMAIN || "anchor.liquivault.finance",
  },
};

export const RISK_TIER_RATES_BPS: Record<RiskTier, number> = {
  "Tier A": 600,  // 6.00% APR (AAA/AA Institutional Debtors)
  "Tier B": 1000, // 10.00% APR (Investment Grade Corporate Debtors)
  "Tier C": 1500, // 15.00% APR (Verified Mid-Market B2B Debtors)
};

/**
 * Calculates the exact institutional factoring quote matching the Soroban LiquidityPool contract math.
 * Protocol fee is 10% of the total discount; 90% accrues directly to LP share value.
 */
export function calculateFactoringQuote(
  faceValueUsdc: number,
  maturityTimestamp: number,
  riskTier: RiskTier
): DiscountQuote {
  const daysToMaturity = getDaysToMaturity(maturityTimestamp);
  const annualizedRateBps = RISK_TIER_RATES_BPS[riskTier] ?? 1000;

  // effective_discount_bps = (annualizedRateBps * daysToMaturity) / 365, minimum 25 bps (0.25%)
  const rawBps = Math.floor((annualizedRateBps * daysToMaturity) / 365);
  const effectiveDiscountBps = Math.max(25, Math.min(rawBps, 3500));

  const totalDiscountUsdc = Number(((faceValueUsdc * effectiveDiscountBps) / 10000).toFixed(2));
  const protocolFeeUsdc = Number((totalDiscountUsdc * 0.1).toFixed(2));
  const lpYieldUsdc = Number((totalDiscountUsdc - protocolFeeUsdc).toFixed(2));
  const netPayoutUsdc = Number((faceValueUsdc - totalDiscountUsdc).toFixed(2));

  return {
    faceValueUsdc,
    daysToMaturity,
    riskTier,
    annualizedRateBps,
    effectiveDiscountBps,
    totalDiscountUsdc,
    protocolFeeUsdc,
    lpYieldUsdc,
    netPayoutUsdc,
  };
}

const nowSec = Math.floor(Date.now() / 1000);

export const INITIAL_INVOICES: UIInvoice[] = [
  {
    id: 1041,
    invoiceRef: "INV-2025-8841",
    merchantAddress: "GB7LQV...M94X2K",
    debtorName: "Siemens Energy Global GmbH",
    debtorAddress: "GD4SIEMENS7ENERGY8GLOBAL2SOROBAN9CORP4TREASURY00001X9",
    amountUsdc: 125000,
    maturityTimestamp: nowSec + 45 * 86400,
    riskTier: "Tier A",
    metadataHash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
    status: "Verified",
    txHash: "94f2a8b1c73e55029e8a1b4c3d2f1a0987654321fedcba9876543210abcdef12",
  },
  {
    id: 1040,
    invoiceRef: "INV-2025-8839",
    merchantAddress: "GB7LQV...M94X2K",
    debtorName: "Maersk Logistics & Supply Chain",
    debtorAddress: "GC8MAERSK4LOGISTICS2SUPPLY9CHAIN1SOROBAN5SETTLE0002M4",
    amountUsdc: 84500,
    maturityTimestamp: nowSec + 60 * 86400,
    riskTier: "Tier A",
    metadataHash: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
    status: "Factored",
    escrowId: 509,
    netPayoutUsdc: 83666.85,
    discountBps: 98,
    txHash: "3b7e91d4f6a280192b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a",
  },
  {
    id: 1039,
    invoiceRef: "INV-2025-8824",
    merchantAddress: "GB7LQV...M94X2K",
    debtorName: "MercadoLibre LatAm Fulfillment",
    debtorAddress: "GA2MERCADO9LIBRE5LATAM3FULFILLMENT7TREASURY8SOROBAN3L",
    amountUsdc: 62000,
    maturityTimestamp: nowSec + 30 * 86400,
    riskTier: "Tier B",
    metadataHash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    status: "Verified",
    txHash: "7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e",
  },
  {
    id: 1038,
    invoiceRef: "INV-2025-8790",
    merchantAddress: "GA9TRD...P31W8Q",
    debtorName: "Flexport Freight International",
    debtorAddress: "GB5FLEXPORT3FREIGHT8INTL2SETTLEMENT6SOROBAN9VAULT007F",
    amountUsdc: 150000,
    maturityTimestamp: nowSec + 75 * 86400,
    riskTier: "Tier B",
    metadataHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    status: "Factored",
    escrowId: 508,
    netPayoutUsdc: 146925.0,
    discountBps: 205,
    txHash: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
  },
  {
    id: 1035,
    invoiceRef: "INV-2025-8712",
    merchantAddress: "GB7LQV...M94X2K",
    debtorName: "Schneider Electric Procurement",
    debtorAddress: "GD9SCHNEIDER2ELECTRIC6PROCUREMENT4SOROBAN1USDC8SETTLE",
    amountUsdc: 95000,
    maturityTimestamp: nowSec - 2 * 86400,
    riskTier: "Tier A",
    metadataHash: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    status: "Settled",
    escrowId: 504,
    netPayoutUsdc: 94290.0,
    discountBps: 75,
    txHash: "5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a",
  },
];

export const INITIAL_TRANSACTIONS: UIProtocolTransaction[] = [
  {
    id: "tx-1",
    type: "FACTOR_INVOICE",
    invoiceId: 1040,
    actor: "GB7LQV...M94X2K",
    amountUsdc: 83666.85,
    timestamp: "12 mins ago",
    txHash: "3b7e91d4f6a280192b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a",
    status: "FINALIZED",
  },
  {
    id: "tx-2",
    type: "LP_DEPOSIT",
    actor: "GD2INV...K88P1R",
    amountUsdc: 250000.0,
    timestamp: "47 mins ago",
    txHash: "8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d",
    status: "FINALIZED",
  },
  {
    id: "tx-3",
    type: "SETTLE_ESCROW",
    invoiceId: 1035,
    actor: "GD9SCH...SETTLE",
    amountUsdc: 95000.0,
    timestamp: "2 hours ago",
    txHash: "5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a",
    status: "FINALIZED",
  },
  {
    id: "tx-4",
    type: "MINT_INVOICE",
    invoiceId: 1041,
    actor: "GB7LQV...M94X2K",
    amountUsdc: 125000.0,
    timestamp: "3 hours ago",
    txHash: "94f2a8b1c73e55029e8a1b4c3d2f1a0987654321fedcba9876543210abcdef12",
    status: "FINALIZED",
  },
];

export const INITIAL_POOL_METRICS: UIPoolMetrics = {
  totalLiquidityUsdc: 2485000,
  utilizedLiquidityUsdc: 1420500,
  availableLiquidityUsdc: 1064500,
  totalFactoredVolumeUsdc: 8940000,
  protocolFeeReserveUsdc: 18420,
  totalLpShares: 2378000,
  sharePriceUsdc: 1.045,
  currentApyBps: 984, // 9.84% APY
  activeEscrowsCount: 18,
  defaultRateBps: 0,
};
