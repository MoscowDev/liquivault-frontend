# Contributing to the frontend

Use Node.js 22.13+ and npm. Clone the SDK and frontend as siblings; cloning the frontend alone is not sufficient for its local SDK dependency.

```sh
git clone https://github.com/MoscowDev/liquivault-sdk.git
git clone https://github.com/MoscowDev/liquivault-frontend.git
cd liquivault-sdk
npm ci
cd ../liquivault-frontend
npm ci
cp .env.example .env.local
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

On PowerShell use `Copy-Item .env.example .env.local`. Do not commit `.env.local`, wallet keys or seeds. Only testnet identities/test assets should be used for demonstrations.

Create a branch from `main` and link an unfinished issue. Explain the user-visible problem, changed behavior and verification. Use `npm run format` / `npm run format:check` for formatting. Ensure responsive layouts and accessible controls, clear loading/empty/error states and no fabricated balances, tokens, authentication or transaction hashes.

Tests may stub the SDK for deterministic UI behavior, but must not treat a fake successful transport as proof of network execution. Current contract quotes and confirmed ledger results must drive financial actions. Explain any cross-repo dependency and merge SDK changes first. CI installs the sibling SDK explicitly and fails on lint/type/test/build errors.

Follow [SECURITY.md](SECURITY.md) for vulnerabilities, the [Code of Conduct](CODE_OF_CONDUCT.md), and [shared review guidance](https://github.com/MoscowDev/LiquiVault/blob/main/CONTRIBUTING.md). Drips participation follows [official guidance](https://docs.drips.network/wave/maintainers/participating-in-a-wave/); repository labels do not establish approval.
