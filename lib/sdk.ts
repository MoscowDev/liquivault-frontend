import { LiquiVaultSDK, RiskTier as SDKRiskTier, type FactoringQuote } from "@liquivault/sdk";
export const toSDKRiskTier = (tier: RiskTier) => ({ "Tier A": SDKRiskTier.TierA, "Tier B": SDKRiskTier.TierB, "Tier C": SDKRiskTier.TierC })[tier];
export const fromSDKRiskTier = (tier: SDKRiskTier): RiskTier => ({ TierA: "Tier A", TierB: "Tier B", TierC: "Tier C" } as const)[tier];
export const fromUnits = (amount: bigint) => Number(amount) / 10_000_000;
export function toUnits(amount: number): bigint {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount * 10_000_000))) throw new Error("Enter a positive amount within the supported precision");
  return BigInt(Math.round(amount * 10_000_000));
}
export function quoteForUI(q: FactoringQuote, reserveBps: number): DiscountQuote {
  const cut = q.totalDiscount * BigInt(reserveBps) / 10000n;
  return { faceValueUsdc: fromUnits(q.faceValue), daysToMaturity: Math.ceil(q.durationSeconds / 86400),
    riskTier: fromSDKRiskTier(q.riskTier), annualizedRateBps: 0,
    effectiveDiscountBps: q.effectiveDiscountBps, totalDiscountUsdc: fromUnits(q.totalDiscount),
    protocolFeeUsdc: fromUnits(cut), lpYieldUsdc: fromUnits(q.totalDiscount - cut), netPayoutUsdc: fromUnits(q.netPayout) };
}
export function createSDK() {
  return new LiquiVaultSDK({ network: { network: "testnet", rpcUrl: STELLAR_CONFIG.rpcUrl,
    horizonUrl: STELLAR_CONFIG.horizonUrl, networkPassphrase: STELLAR_CONFIG.networkPassphrase },
    contracts: { invoiceRegistry: STELLAR_CONFIG.contracts.invoiceAsset, liquidityPool: STELLAR_CONFIG.contracts.liquidityPool,
      factoringEscrow: STELLAR_CONFIG.contracts.escrowRouting, usdcToken: STELLAR_CONFIG.contracts.usdcToken } });
}

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
  /** Junior (first-loss) tranche capital, included in 	otalLiquidityUsdc. */
  juniorLiquidityUsdc: number;
  juniorSharePriceUsdc: number;
  /** Share of LP yield paid to junior while it holds capital. */
  juniorYieldBps: number | null;
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
      "CBYTATTI4S32LCK5W2N4P6U64MAGROW5ZH7DOXAO4CIOY2KWDNIDLSQY",
    liquidityPool:
      process.env.NEXT_PUBLIC_LIQUIDITY_POOL_CONTRACT_ID ||
      "CCRZRIUMDZ67YDHWMPUFO2LZNGKS2QDRPNK23MUVBYMXYHDDQNNDULGR",
    escrowRouting:
      process.env.NEXT_PUBLIC_ESCROW_ROUTING_CONTRACT_ID ||
      "CBQGNTVLNXV2LZ47GTOUK2TQNTNBNWUWSAKXVYHCURAVL7UZENQ7U42C",
    usdcToken:
      process.env.NEXT_PUBLIC_USDC_TOKEN_CONTRACT_ID ||
      "CCELQDGSNDDQHVDXQM3CXBCR4LOGLVAIKKET4RY72MZP7SKTEOY2RO2K",
  },

};

export const RISK_TIER_RATES_BPS: Record<RiskTier, number> = {
  "Tier A": 600,  // 6.00% APR (AAA/AA Institutional Debtors)
  "Tier B": 1000, // 10.00% APR (Investment Grade Corporate Debtors)
  "Tier C": 1500, // 15.00% APR (Verified Mid-Market B2B Debtors)
};

export const INITIAL_INVOICES: UIInvoice[] = [];
export const INITIAL_TRANSACTIONS: UIProtocolTransaction[] = [];
export const INITIAL_POOL_METRICS: UIPoolMetrics = {
  totalLiquidityUsdc: 0, utilizedLiquidityUsdc: 0, availableLiquidityUsdc: 0,
  totalFactoredVolumeUsdc: 0, protocolFeeReserveUsdc: 0, totalLpShares: 0,
  sharePriceUsdc: 1, currentApyBps: 0, activeEscrowsCount: 0, defaultRateBps: 0,
  juniorLiquidityUsdc: 0, juniorSharePriceUsdc: 1, juniorYieldBps: null,
};

/** Junior capital must stay >= this share of deployed capital (mirrors the Soroban contract). */
export const JUNIOR_MIN_COVERAGE_BPS = 1000;

/**
 * Splits LP yield between tranches like `repay_liquidity`: with no junior capital senior gets all of it.
 */
export function splitTrancheYield(
  lpYieldUsdc: number,
  juniorLiquidityUsdc: number,
  juniorYieldBps: number,
  seniorLiquidityUsdc: number
): { juniorYieldUsdc: number; seniorYieldUsdc: number } {
  const juniorYieldUsdc =
    juniorLiquidityUsdc > 0
      ? Number(((lpYieldUsdc * Math.min(juniorYieldBps, Math.floor(juniorLiquidityUsdc * 10000 / (juniorLiquidityUsdc + seniorLiquidityUsdc)))) / 10000).toFixed(2))
      : 0;
  return {
    juniorYieldUsdc,
    seniorYieldUsdc: Number((lpYieldUsdc - juniorYieldUsdc).toFixed(2)),
  };
}

/** Splits a default loss like `write_off_default`: junior absorbs first. */
export function splitTrancheLoss(
  lossUsdc: number,
  juniorLiquidityUsdc: number
): { juniorLossUsdc: number; seniorLossUsdc: number } {
  const juniorLossUsdc = Math.min(lossUsdc, juniorLiquidityUsdc);
  return {
    juniorLossUsdc,
    seniorLossUsdc: Number((lossUsdc - juniorLossUsdc).toFixed(2)),
  };
}

/**
 * Checks a junior withdrawal against the coverage rule and idle liquidity.
 * `deployedUsdc` is capital currently lent out on invoices.
 */
export function checkJuniorWithdrawal(
  withdrawUsdc: number,
  juniorLiquidityUsdc: number,
  deployedUsdc: number,
  idleLiquidityUsdc: number
): { allowed: boolean; reason?: string; remainingJuniorUsdc: number } {
  const remainingJuniorUsdc = Number((juniorLiquidityUsdc - withdrawUsdc).toFixed(2));
  if (withdrawUsdc > juniorLiquidityUsdc) {
    return { allowed: false, reason: "Exceeds junior tranche balance", remainingJuniorUsdc };
  }
  if (withdrawUsdc > idleLiquidityUsdc) {
    return { allowed: false, reason: "Insufficient idle pool liquidity", remainingJuniorUsdc };
  }
  const required = (deployedUsdc * JUNIOR_MIN_COVERAGE_BPS) / 10000;
  if (remainingJuniorUsdc < required) {
    return {
      allowed: false,
      reason: `Junior capital must stay above 10% of deployed capital (${required.toLocaleString()} USDC)`,
      remainingJuniorUsdc,
    };
  }
  return { allowed: true, remainingJuniorUsdc };
}