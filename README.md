# LiquiVault frontend

[![CI](https://github.com/MoscowDev/liquivault-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/MoscowDev/liquivault-frontend/actions/workflows/ci.yml)
[MIT license](LICENSE)

Next.js/React interface for the LiquiVault Stellar testnet prototype. Merchant factoring, senior/junior positions and contract snapshots use `@liquivault/sdk`. **Pre-audit, testnet only.** The configured asset is an issuer-controlled test token, not Circle-issued USDC.

## Run from clean checkouts

The `/setup` page explains test XLM, operator-issued LVTEST and the lack of a public token faucet. `/verifier` lets the configured verifier/admin inspect and approve an invoice through Freighter. Role authorization is enforced by the registry, not granted by visiting the page. Redemption status uses integer snapshot arithmetic and actual last-deposit timestamps; execution remains authoritative.

### Browser verification

After installing dependencies, run `npx playwright install chromium` then `npm run test:browser`. CI installs Chromium with system dependencies. Eight scenarios use test-only Freighter message/RPC fixtures: missing wallet, wrong network, connect/disconnect with unavailable RPC, rejected signing, confirmed submission, changed account, changed network and uncertain submission. Fixtures use the production adapter and real Stellar XDR without a production fake-wallet switch. No real network write or extension signing is claimed. `npm test` separately covers component behavior, delayed sessions and redemption boundaries.

`npm run build` produces the static `out/` directory. Host the exported HTML/assets, including direct routes; `next start` is not a static-export server. Never configure private keys in public build variables.

Node.js 22.13+ and npm are required. The SDK must be cloned alongside this repository:

```sh
git clone https://github.com/MoscowDev/liquivault-sdk.git
git clone https://github.com/MoscowDev/liquivault-frontend.git
cd liquivault-sdk
npm ci
cd ../liquivault-frontend
npm ci
cp .env.example .env.local
npm run dev
```

PowerShell: use `Copy-Item .env.example .env.local`. Open http://localhost:3000. The `file:../liquivault-sdk` dependency is intentional: no published npm package is assumed. CI checks out/builds that sibling before frontend installation.

Configure RPC URL, network passphrase and four contract IDs in `.env.local`. Defaults must match the [current deployment record](https://github.com/MoscowDev/liquivault-contracts/blob/main/deployments/testnet.json). Do not use older immutable deployments to claim the current contract protections. Install/unlock Freighter, select the configured testnet and use a funded account with test tokens for writes.

## What the application does

- Starts disconnected; missing Freighter and network/account mismatches produce errors.
- Reads real balances/positions and the connected merchant's invoices.
- Uses escrow's quote preview, including origination fees and current configuration.
- Mints invoices as `Issued`; independent configured verifier/admin approval is required before factoring.
- Prepares and signs transactions through the SDK, waits for confirmation and refreshes reads. Rejections do not generate fake balances or hashes.
- Refreshes snapshots every 30 seconds. Activity shows confirmed writes in this session only.

APY/default-rate history and a historical indexer are unavailable. Treasury token balance is not a historical fee total. No SEP-10/KYB, SEP-24, automatic invoice verification or fabricated demonstration mode is implemented. Registry ownership does not establish legal assignment.

Each deposit resets a 24-hour lock on the provider's entire position in that tranche. Idle liquidity and junior first-loss coverage can delay redemption further. Junior yield is capital-capped; neither tranche guarantees principal or return.

## Verify

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

Lint failures fail CI. New SDK API changes must be merged before dependent frontend changes. Unit tests do not replace interactive wallet testing; follow the [deployment runbook](https://github.com/MoscowDev/LiquiVault/blob/main/docs/deployment.md) for signed network evidence.

`typecheck` generates Next route types before invoking TypeScript, so it also works before the first production build in a fresh checkout. The Vitest config is native ESM and does not depend on CommonJS `__dirname` behavior.

The [manual wallet walkthrough](https://github.com/MoscowDev/LiquiVault/blob/main/docs/wallet-demo.md) explains test-token trustlines, obtaining tokens from an issuer you control and independent invoice verification. The lint toolchain uses ESLint 9 to respect the current Next plugin peer ranges; the lockfile and scoped minimatch override keep its dependency graph audited. Do not replace these with forced peer installs.

[Contributing](CONTRIBUTING.md) | [Security](SECURITY.md) | [Architecture](https://github.com/MoscowDev/LiquiVault/blob/main/docs/architecture.md)
