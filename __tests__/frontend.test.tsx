import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  formatUSDC,
  formatBps,
  formatAddress,
  generateInvoiceMetadataHash,
} from "@/lib/utils";
import {
  calculateFactoringQuote,
  INITIAL_INVOICES,
  INITIAL_POOL_METRICS,
} from "@/lib/sdk";
import { WalletProvider } from "@/context/WalletContext";
import DashboardPage from "@/app/dashboard/page";
import MerchantPage from "@/app/merchant/page";
import InvestorPage from "@/app/investor/page";

describe("LiquiVault Frontend Utility & Pricing Math", () => {
  it("formats USDC amounts and stroops accurately", () => {
    expect(formatUSDC(125000)).toBe("$125,000.00");
    expect(formatUSDC(83666.85)).toBe("$83,666.85");
    expect(formatUSDC(1000_0000000n, true)).toBe("$1,000.00");
  });

  it("formats basis points into percentages", () => {
    expect(formatBps(600)).toBe("6.00%");
    expect(formatBps(984)).toBe("9.84%");
    expect(formatBps(145)).toBe("1.45%");
  });

  it("truncates Stellar public keys and contract addresses cleanly", () => {
    const addr = "GB7LQV5MERCHANT8INSTITUTIONAL4SOROBAN9VAULT2WALLET7M94X2K";
    expect(formatAddress(addr, 6)).toBe("GB7LQV...M94X2K");
  });

  it("calculates time-weighted factoring discount quotes matching Soroban pool math", () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const maturity45d = nowSec + 45 * 86400;
    const quote = calculateFactoringQuote(100000, maturity45d, "Tier A");

    expect(quote.faceValueUsdc).toBe(100000);
    expect(quote.annualizedRateBps).toBe(600);
    expect(quote.effectiveDiscountBps).toBeGreaterThanOrEqual(70);
    expect(quote.netPayoutUsdc).toBe(
      Number((quote.faceValueUsdc - quote.totalDiscountUsdc).toFixed(2))
    );
    expect(
      Number((quote.protocolFeeUsdc + quote.lpYieldUsdc).toFixed(2))
    ).toBe(quote.totalDiscountUsdc);
  });

  it("generates a 64-character hex SHA-256 metadata commitment", async () => {
    const hash = await generateInvoiceMetadataHash("INV-2025-8904|Siemens|125000");
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });
});

describe("LiquiVault Institutional Views Rendering", () => {
  it("renders Protocol Analytics Dashboard with TVL, APY, and ledger transactions", () => {
    render(
      <WalletProvider>
        <DashboardPage />
      </WalletProvider>
    );

    expect(
      screen.getByText(/Protocol Analytics & Risk Telemetry/i)
    ).toBeDefined();
    expect(
      screen.getByText(formatUSDC(INITIAL_POOL_METRICS.totalLiquidityUsdc))
    ).toBeDefined();
    expect(
      screen.getByText(formatBps(INITIAL_POOL_METRICS.currentApyBps))
    ).toBeDefined();
  });

  it("renders Merchant Factoring view with invoice tokenization form and factoring quote modal", () => {
    render(
      <WalletProvider>
        <MerchantPage />
      </WalletProvider>
    );

    expect(
      screen.getByText(/Merchant Receivable Tokenization & Factoring/i)
    ).toBeDefined();
    expect(
      screen.getByText(INITIAL_INVOICES[0].debtorName)
    ).toBeDefined();

    // Open Factoring Quote Modal for first verified invoice
    const factorButtons = screen.getAllByRole("button", {
      name: /Factor for/i,
    });
    expect(factorButtons.length).toBeGreaterThan(0);
    fireEvent.click(factorButtons[0]);

    expect(
      screen.getByText(/Atomic USDC Factoring Quote/i)
    ).toBeDefined();
  });

  it("renders Investor Liquidity Vault with lvUSDC share index and deposit/withdraw tabs", () => {
    render(
      <WalletProvider>
        <InvestorPage />
      </WalletProvider>
    );

    expect(
      screen.getByText(/Institutional USDC Liquidity Vault/i)
    ).toBeDefined();
    expect(screen.getByText(/125,000 lvUSDC/i)).toBeDefined();
  });
});
