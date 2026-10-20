# LiquiVault Frontend (`liquivault-frontend`)

Institutional B2B Trade Receivables Factoring, Algorithmic Discount Pricing, and Liquidity Pool Dashboard built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Freighter Wallet API**, and **`@liquivault/sdk`** on **Stellar Soroban**.

---

## Key Features & Views

1. **Protocol Analytics (`/dashboard`)**
   - Real-time Total Value Locked (TVL), Cumulative Factored Volume, Current Pool APY, lvUSDC Share Price Index, and Active Escrows telemetry.
   - Capital Utilization ratio and Underwriting Risk Tier distribution (`Tier A` 6.00% APR, `Tier B` 10.00% APR, `Tier C` 15.00% APR).
   - Live Soroban settlement and factoring ledger with transaction hashes.

2. **Merchant Receivable Tokenization & Factoring (`/merchant`)**
   - **Tokenize Trade Receivable (`InvoiceAsset`)**: Mint verified on-chain RWA invoice claims with debtor Stellar account, USDC face value, net-30 to net-90 maturity terms, underwriting risk tier, and client-side SHA-256 document commitment generator.
   - **One-Click Instant USDC Factoring (`LiquidityPool`)**: Interactive factoring quote modal displaying time-weighted discount basis points, 90% LP yield allocation, 10% protocol reserve fee, and net instant USDC payout signed via Freighter.
   - **Debtor Atomic Settlement (`EscrowRouting`)**: Simulate or execute full invoice settlement at maturity, automatically routing principal and accrued yield back to the liquidity pool.

3. **Institutional USDC Liquidity Vault (`/investor`)**
   - Deposit SEP-41 Circle USDC to mint yield-bearing `lvUSDC` LP shares.
   - Burn `lvUSDC` shares to redeem underlying USDC principal plus auto-compounded factoring yield.
   - Real-time vault utilization and first-loss reserve protection telemetry.

4. **Freighter Wallet & SEP-10 Institutional KYB (`WalletContext`)**
   - Seamless connection to `@stellar/freighter-api` on Stellar Soroban Testnet (`Test SDF Network ; September 2015`) with an interactive institutional signer fallback so every workflow can be tested immediately in any browser.
   - One-click **SEP-10 Web Authentication** session verification.

---

## Project Structure

```text
liquivault-frontend/
├── app/
│   ├── globals.css           # Institutional dark/slate theme & CSS variables
│   ├── layout.tsx            # Root layout with WalletProvider & Navbar
│   ├── page.tsx              # Institutional landing overview & live KPI strip
│   ├── dashboard/page.tsx    # Protocol analytics, risk tiers & Soroban tx ledger
│   ├── merchant/page.tsx     # RWA invoice minting, SHA-256 hashing & instant factoring
│   └── investor/page.tsx     # USDC deposit, lvUSDC share minting & redemption
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

## Quick Start

### 1. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

### 2. Install Dependencies & Run Development Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Component & Pricing Unit Tests

```bash
npm test
```
