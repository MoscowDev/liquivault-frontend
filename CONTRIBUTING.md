# Contributing to LiquiVault Frontend (`liquivault-frontend`)

Thank you for contributing to the **LiquiVault Institutional Web Application**, built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **`shadcn/ui`**, **Freighter Wallet**, and **`@liquivault/sdk`** on **Stellar Soroban**! We actively welcome **Drips Wave** contributors.

---

## Prerequisites

- **Node.js**: `>= 20.x`
- **npm**: `>= 10.x`
- **Freighter Wallet Extension** (optional for live Stellar Testnet signing; an institutional fallback signer is built-in for local development and automated testing)

---

## Local Setup

1. **Fork & Clone the Repository**
   ```bash
   git clone https://github.com/<your-username>/liquivault-frontend.git
   cd liquivault-frontend
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```

3. **Install Dependencies & Start Dev Server**
   ```bash
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Run Linter, Tests & Production Build**
   ```bash
   npm run lint
   npm test
   npm run build
   ```

---

## UI & Architecture Guidelines

- **App Router Views**: Core institutional views live in `app/dashboard`, `app/merchant`, and `app/investor`.
- **Reusable Components**: Place atomic UI primitives in `components/ui/` and layout components in `components/layout/`.
- **State & Wallet Integration**: Protocol and Freighter wallet interactions are managed via `context/WalletContext.tsx` and helper functions in `lib/sdk.ts` and `lib/utils.ts`.
- **Testing**: Add Vitest + React Testing Library tests in `__tests__/frontend.test.tsx` for new components, modals, or financial formatting utilities.

---

## Submitting a Pull Request

1. Ensure `npm test` and `npm run build` pass cleanly.
2. Include screenshots or a brief screen recording for any UI changes.
3. Reference the issue number (`Closes #<issue-number>`) in the PR description.
