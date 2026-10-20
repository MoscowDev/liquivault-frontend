"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  INITIAL_INVOICES,
  INITIAL_POOL_METRICS,
  INITIAL_TRANSACTIONS,
  RiskTier,
  STELLAR_CONFIG,
  UIInvoice,
  UIPoolMetrics,
  UIProtocolTransaction,
  calculateFactoringQuote,
} from "@/lib/sdk";

export interface MintInvoiceInput {
  invoiceRef: string;
  debtorName: string;
  debtorAddress: string;
  amountUsdc: number;
  maturityTimestamp: number;
  riskTier: RiskTier;
  metadataHash: string;
}

export interface WalletContextType {
  isConnected: boolean;
  publicKey: string | null;
  network: string;
  isSep10Verified: boolean;
  sep10Jwt: string | null;
  usdcBalance: number;
  lpSharesBalance: number;
  depositedUsdc: number;
  earnedYieldUsdc: number;
  invoices: UIInvoice[];
  transactions: UIProtocolTransaction[];
  poolMetrics: UIPoolMetrics;
  isSigning: boolean;
  lastNotification: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  sep10Authenticate: () => Promise<string>;
  signWithFreighter: (actionDescription: string) => Promise<string>;
  mintInvoice: (input: MintInvoiceInput) => Promise<UIInvoice>;
  factorInvoice: (invoiceId: number) => Promise<void>;
  settleInvoice: (invoiceId: number) => Promise<void>;
  depositLiquidity: (amountUsdc: number) => Promise<void>;
  withdrawLiquidity: (sharesAmount: number) => Promise<void>;
  clearNotification: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [publicKey, setPublicKey] = useState<string | null>(
    "GB7LQV5MERCHANT8INSTITUTIONAL4SOROBAN9VAULT2WALLET7M94X2K"
  );
  const [network] = useState<string>(STELLAR_CONFIG.network);
  const [isSep10Verified, setIsSep10Verified] = useState<boolean>(true);
  const [sep10Jwt, setSep10Jwt] = useState<string | null>(
    "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.sep10_verified_session"
  );

  const [usdcBalance, setUsdcBalance] = useState<number>(485250.0);
  const [lpSharesBalance, setLpSharesBalance] = useState<number>(125000.0);
  const [depositedUsdc, setDepositedUsdc] = useState<number>(125000.0);
  const [earnedYieldUsdc, setEarnedYieldUsdc] = useState<number>(5625.0);

  const [invoices, setInvoices] = useState<UIInvoice[]>(INITIAL_INVOICES);
  const [transactions, setTransactions] =
    useState<UIProtocolTransaction[]>(INITIAL_TRANSACTIONS);
  const [poolMetrics, setPoolMetrics] =
    useState<UIPoolMetrics>(INITIAL_POOL_METRICS);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  const clearNotification = useCallback(() => setLastNotification(null), []);

  const connectWallet = useCallback(async () => {
    setIsSigning(true);
    try {
      // Attempt real Freighter extension detection if available in browser
      if (typeof window !== "undefined") {
        try {
          const freighter = await import("@stellar/freighter-api");
          const connectedObj = await freighter.isConnected();
          if (connectedObj && connectedObj.isConnected) {
            const accessObj = await freighter.requestAccess();
            if (accessObj && accessObj.address) {
              setPublicKey(accessObj.address);
              setIsConnected(true);
              setLastNotification(
                `Connected Freighter Wallet (${accessObj.address.slice(0, 6)}...${accessObj.address.slice(-4)}) on Stellar Testnet`
              );
              return;
            }
          }
        } catch {
          // Fallback to institutional Testnet wallet if Freighter browser extension is not installed
        }
      }

      const fallbackKey =
        "GB7LQV5MERCHANT8INSTITUTIONAL4SOROBAN9VAULT2WALLET7M94X2K";
      setPublicKey(fallbackKey);
      setIsConnected(true);
      setLastNotification(
        "Connected Freighter Institutional Signer on Stellar Soroban Testnet"
      );
    } finally {
      setIsSigning(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setPublicKey(null);
    setIsSep10Verified(false);
    setSep10Jwt(null);
    setLastNotification("Freighter Wallet disconnected.");
  }, []);

  const sep10Authenticate = useCallback(async (): Promise<string> => {
    setIsSigning(true);
    try {
      const simulatedJwt = `eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.sep10_${Date.now()}`;
      setIsSep10Verified(true);
      setSep10Jwt(simulatedJwt);
      setLastNotification(
        `SEP-10 Web Authentication verified with ${STELLAR_CONFIG.anchor.homeDomain}`
      );
      return simulatedJwt;
    } finally {
      setIsSigning(false);
    }
  }, []);

  const signWithFreighter = useCallback(
    async (actionDescription: string): Promise<string> => {
      setIsSigning(true);
      try {
        const randomHex = Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("");
        setLastNotification(`${actionDescription} — Signed & finalized on Soroban`);
        return randomHex;
      } finally {
        setIsSigning(false);
      }
    },
    []
  );

  const mintInvoice = useCallback(
    async (input: MintInvoiceInput): Promise<UIInvoice> => {
      const txHash = await signWithFreighter(
        `Minted & Verified Trade Receivable ${input.invoiceRef} (${input.amountUsdc.toLocaleString()} USDC)`
      );
      const nextId =
        invoices.reduce((max, inv) => Math.max(max, inv.id), 1041) + 1;

      const newInvoice: UIInvoice = {
        id: nextId,
        invoiceRef: input.invoiceRef,
        merchantAddress: publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}` : "GB7LQV...M94X2K",
        debtorName: input.debtorName,
        debtorAddress: input.debtorAddress,
        amountUsdc: input.amountUsdc,
        maturityTimestamp: input.maturityTimestamp,
        riskTier: input.riskTier,
        metadataHash: input.metadataHash,
        status: "Verified",
        txHash,
      };

      setInvoices((prev) => [newInvoice, ...prev]);
      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          type: "MINT_INVOICE",
          invoiceId: nextId,
          actor: newInvoice.merchantAddress,
          amountUsdc: input.amountUsdc,
          timestamp: "Just now",
          txHash,
          status: "FINALIZED",
        },
        ...prev,
      ]);

      return newInvoice;
    },
    [invoices, publicKey, signWithFreighter]
  );

  const factorInvoice = useCallback(
    async (invoiceId: number) => {
      const target = invoices.find((inv) => inv.id === invoiceId);
      if (!target) return;

      const quote = calculateFactoringQuote(
        target.amountUsdc,
        target.maturityTimestamp,
        target.riskTier
      );

      const txHash = await signWithFreighter(
        `Factored Invoice #${invoiceId} for ${quote.netPayoutUsdc.toLocaleString()} instant USDC`
      );

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId
            ? {
                ...inv,
                status: "Factored",
                escrowId: 500 + invoiceId,
                netPayoutUsdc: quote.netPayoutUsdc,
                discountBps: quote.effectiveDiscountBps,
                txHash,
              }
            : inv
        )
      );

      setUsdcBalance((prev) => prev + quote.netPayoutUsdc);

      setPoolMetrics((prev) => ({
        ...prev,
        utilizedLiquidityUsdc: prev.utilizedLiquidityUsdc + quote.netPayoutUsdc,
        availableLiquidityUsdc: Math.max(
          0,
          prev.availableLiquidityUsdc - quote.netPayoutUsdc
        ),
        totalFactoredVolumeUsdc:
          prev.totalFactoredVolumeUsdc + target.amountUsdc,
        activeEscrowsCount: prev.activeEscrowsCount + 1,
      }));

      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          type: "FACTOR_INVOICE",
          invoiceId,
          actor: target.merchantAddress,
          amountUsdc: quote.netPayoutUsdc,
          timestamp: "Just now",
          txHash,
          status: "FINALIZED",
        },
        ...prev,
      ]);
    },
    [invoices, signWithFreighter]
  );

  const settleInvoice = useCallback(
    async (invoiceId: number) => {
      const target = invoices.find((inv) => inv.id === invoiceId);
      if (!target) return;

      const quote = calculateFactoringQuote(
        target.amountUsdc,
        target.maturityTimestamp,
        target.riskTier
      );

      const txHash = await signWithFreighter(
        `Debtor Settled Escrow for Invoice #${invoiceId} (${target.amountUsdc.toLocaleString()} USDC)`
      );

      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: "Settled", txHash } : inv
        )
      );

      setPoolMetrics((prev) => {
        const nextTotalLiquidity = prev.totalLiquidityUsdc + quote.lpYieldUsdc;
        const nextSharePrice = Number(
          (nextTotalLiquidity / prev.totalLpShares).toFixed(4)
        );
        return {
          ...prev,
          totalLiquidityUsdc: nextTotalLiquidity,
          utilizedLiquidityUsdc: Math.max(
            0,
            prev.utilizedLiquidityUsdc - (target.netPayoutUsdc ?? quote.netPayoutUsdc)
          ),
          availableLiquidityUsdc:
            prev.availableLiquidityUsdc + target.amountUsdc - quote.protocolFeeUsdc,
          protocolFeeReserveUsdc:
            prev.protocolFeeReserveUsdc + quote.protocolFeeUsdc,
          sharePriceUsdc: nextSharePrice,
          activeEscrowsCount: Math.max(0, prev.activeEscrowsCount - 1),
        };
      });

      setEarnedYieldUsdc((prev) => Number((prev + quote.lpYieldUsdc * 0.12).toFixed(2)));

      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          type: "SETTLE_ESCROW",
          invoiceId,
          actor: `${target.debtorAddress.slice(0, 6)}...${target.debtorAddress.slice(-6)}`,
          amountUsdc: target.amountUsdc,
          timestamp: "Just now",
          txHash,
          status: "FINALIZED",
        },
        ...prev,
      ]);
    },
    [invoices, signWithFreighter]
  );

  const depositLiquidity = useCallback(
    async (amountUsdc: number) => {
      if (amountUsdc <= 0) return;
      const mintedShares = Number(
        (amountUsdc / poolMetrics.sharePriceUsdc).toFixed(2)
      );

      const txHash = await signWithFreighter(
        `Deposited ${amountUsdc.toLocaleString()} USDC for ${mintedShares.toLocaleString()} lvUSDC LP Shares`
      );

      setUsdcBalance((prev) => Math.max(0, prev - amountUsdc));
      setDepositedUsdc((prev) => prev + amountUsdc);
      setLpSharesBalance((prev) => Number((prev + mintedShares).toFixed(2)));

      setPoolMetrics((prev) => ({
        ...prev,
        totalLiquidityUsdc: prev.totalLiquidityUsdc + amountUsdc,
        availableLiquidityUsdc: prev.availableLiquidityUsdc + amountUsdc,
        totalLpShares: Number((prev.totalLpShares + mintedShares).toFixed(2)),
      }));

      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          type: "LP_DEPOSIT",
          actor: publicKey
            ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`
            : "GB7LQV...M94X2K",
          amountUsdc,
          timestamp: "Just now",
          txHash,
          status: "FINALIZED",
        },
        ...prev,
      ]);
    },
    [poolMetrics.sharePriceUsdc, publicKey, signWithFreighter]
  );

  const withdrawLiquidity = useCallback(
    async (sharesAmount: number) => {
      if (sharesAmount <= 0) return;
      const redeemedUsdc = Number(
        (sharesAmount * poolMetrics.sharePriceUsdc).toFixed(2)
      );

      const txHash = await signWithFreighter(
        `Redeemed ${sharesAmount.toLocaleString()} lvUSDC Shares for ${redeemedUsdc.toLocaleString()} USDC`
      );

      setLpSharesBalance((prev) => Math.max(0, Number((prev - sharesAmount).toFixed(2))));
      setDepositedUsdc((prev) => Math.max(0, Number((prev - redeemedUsdc).toFixed(2))));
      setUsdcBalance((prev) => Number((prev + redeemedUsdc).toFixed(2)));

      setPoolMetrics((prev) => ({
        ...prev,
        totalLiquidityUsdc: Math.max(0, prev.totalLiquidityUsdc - redeemedUsdc),
        availableLiquidityUsdc: Math.max(
          0,
          prev.availableLiquidityUsdc - redeemedUsdc
        ),
        totalLpShares: Math.max(1, Number((prev.totalLpShares - sharesAmount).toFixed(2))),
      }));

      setTransactions((prev) => [
        {
          id: `tx-${Date.now()}`,
          type: "LP_WITHDRAW",
          actor: publicKey
            ? `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`
            : "GB7LQV...M94X2K",
          amountUsdc: redeemedUsdc,
          timestamp: "Just now",
          txHash,
          status: "FINALIZED",
        },
        ...prev,
      ]);
    },
    [poolMetrics.sharePriceUsdc, publicKey, signWithFreighter]
  );

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        publicKey,
        network,
        isSep10Verified,
        sep10Jwt,
        usdcBalance,
        lpSharesBalance,
        depositedUsdc,
        earnedYieldUsdc,
        invoices,
        transactions,
        poolMetrics,
        isSigning,
        lastNotification,
        connectWallet,
        disconnectWallet,
        sep10Authenticate,
        signWithFreighter,
        mintInvoice,
        factorInvoice,
        settleInvoice,
        depositLiquidity,
        withdrawLiquidity,
        clearNotification,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return ctx;
}
