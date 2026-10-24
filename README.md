# LiquiVault Frontend (`liquivault-frontend`)

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](../LICENSE)
[![Stellar Protocol](https://img.shields.io/badge/Stellar_Protocol-21%20%7C%2022-brightgreen.svg)](https://stellar.org)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black.svg)](https://nextjs.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com)
[![Test Suite](https://img.shields.io/badge/Tests-12%2F12%20Passed-success.svg)](../docs/EVIDENCE.md)

B2B invoice factoring, risk-tiered discount pricing, and Liquidity Pool Dashboard built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Freighter Wallet API**, and **`@liquivault/sdk`** on **Stellar Soroban**.

---

## 1. Key Features & Views

### 1.1 Protocol Analytics Dashboard (`/dashboard`)
- **Real-Time Telemetry**: Total Value Locked (TVL), Cumulative Factored Volume, Current Pool APY, `lvUSDC` Share Price Index, and Active Escrows counter.
- **Risk Distribution**: Dynamic breakdown across Underwriting Risk Tiers (`Tier A` 6.00% APR, `Tier B` 10.00% APR, `Tier C` 15.00% APR).
- **Soroban Transaction Ledger**: Live transaction ledger tracking tokenization mints, verifications, factoring advances, repayments, and default write-offs with Stellar ledger IDs and explorer links.

### 1.2 Merchant Factoring Portal (`/merchant`)
- **Tokenize Receivable**: Mint verified on-chain RWA invoice claims with debtor Stellar account, USDC face value, net-30 to net-90 maturity dates, and client-side RFC-6902 SHA-256 document commitment generator.
- **Instant Factoring Quote Preview**: Live calculation displaying time-weighted discount basis points, 90% LP yield allocation, 10% protocol reserve fee, and net instant USDC payout.
- **Debtor Settlement**: Single-click maturity settlement simulation routing principal and yield back to the liquidity pool.

### 1.3 Institutional Liquidity Vault (`/investor`)
- **Senior Vault Tranche (`lvUSDC`)**: Deposit USDC to mint pro-rata shares. Redeem underlying USDC principal plus auto-compounded yield.
- **Junior First-Loss Tranche (`jUSDC`)**: Higher APY tranche absorbing first-loss defaults. Features real-time **10% Deployed Capital Coverage** health telemetry and withdrawal lock preview.

### 1.4 Freighter Wallet & SEP-10 Authentication (`WalletContext`)
- Full integration with `@stellar/freighter-api` on Stellar Soroban Testnet (`Test SDF Network ; September 2015`).
- Includes an interactive Institutional Signer fallback to test and demonstrate workflows seamlessly in any browser environment without external extensions.
- SEP-10 Web Authentication challenge signing.

---

## 2. Project Structure

```text
liquivault-frontend/
├── app/
│   ├── globals.css           # Institutional dark/slate theme & CSS variables
│   ├── layout.tsx            # Root layout with WalletProvider & Navbar
│   ├── page.tsx              # Institutional landing overview & live KPI strip
│   ├── dashboard/page.tsx    # Protocol analytics, risk tiers & Soroban tx ledger
│   ├── merchant/page.tsx     # RWA invoice minting, SHA-256 hashing & instant factoring
│   └── investor/page.tsx     # Senior & Junior vault deposit, share minting & redemption
├── components/
│   ├── layout/Navbar.tsx     # Navigation, Stellar Testnet badge, SEP-10 & Freighter button
│   └── ui/                   # Reusable shadcn/ui primitives (Button, Card, Dialog, Tabs, Table, etc.)
├── context/
│   └── WalletContext.tsx     # Freighter wallet integration, SEP-10 auth & live protocol state
├── lib/
│   ├── sdk.ts                # Stellar Testnet contract config & algorithmic factoring math
│   └── utils.ts              # Currency/stroop formatting, basis points & SHA-256 helpers
└── __tests__/
    └── frontend.test.tsx     # Vitest + React Testing Library unit & integration tests
```

---

## 3. Quick Start & Setup

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Step 2: Install Dependencies & Run Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 3: Run Test Suite
```bash
# Run all Vitest + React Testing Library tests (12 tests)
npm test
```

---

## 4. Documentation Links

- [Protocol Architecture Specification](../docs/architecture.md)
- [Verified Test Evidence & Proofs](../docs/EVIDENCE.md)
- [Security Policy & Threat Model](../docs/SECURITY.md)
- [Testnet Deployment Runbook](../docs/deployment.md)
- [Contract Storage & State TTL Policy](../docs/storage.md)
