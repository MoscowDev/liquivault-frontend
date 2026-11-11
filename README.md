# LiquiVault frontend

Next.js interface to the LiquiVault Stellar testnet contracts through `@liquivault/sdk`.

## Run locally

Use Node.js 22.12 or newer. Keep `liquivault-sdk` alongside this repository (the frontend uses `file:../liquivault-sdk`).

```sh
cd ../liquivault-sdk
npm ci
cd ../liquivault-frontend
npm ci
cp .env.example .env.local
npm run dev
```

Configure the RPC endpoint, network passphrase and contract addresses in `.env.local`. The checked-in addresses refer to the historical testnet deployment, which uses a **test token, not Circle-issued USDC**. Deploy the repaired contracts and update these addresses before validating the new contract protections. Existing immutable deployments cannot receive the new upgrade function retroactively.

The wallet starts disconnected. Install Freighter, select the configured network and connect a funded account. Transactions are built with an account sequence, prepared through Soroban RPC, signed by Freighter and polled until confirmation. Wallet rejection and RPC failures are displayed without generating balances or hashes. A timeout includes the submitted hash; inspect it before retrying.

Pool snapshots refresh every 30 seconds. Invoice lists are the connected merchant's on-chain invoices. Activity contains confirmed transactions from this browser session only. APY and historical default-rate metrics are unavailable; no historical indexer is included. A treasury balance is displayed as its current token balance, not a historical fee total.

Minting creates an `Issued` invoice. An authorized verifier/admin must verify it independently before factoring. Factoring previews come from `preview_factoring_quote`, including the origination fee and current contract configuration. Quotes may change before execution. A connected payer can repay a factored invoice. No SEP-10/KYB, SEP-24 anchor integration or automatic verification is implemented or claimed.

Repaired pool contracts lock withdrawals of a tranche for 24 hours after its most recent deposit. Junior yield is capped by its proportion of total senior plus junior assets. Junior withdrawals also preserve first-loss coverage while loans are deployed. The time lock prevents immediate settlement round trips but does not remove all timing incentives.

## Checks

```sh
npm run lint
npm test
npm run build
```

CI checks out the sibling SDK, builds it, and runs frontend checks. Merge the SDK changes before the dependent frontend changes. Lint failures fail CI.
