import Link from "next/link";
import { STELLAR_CONFIG } from "@/lib/sdk";
export default function SetupPage() {
  return (
    <article className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Try LiquiVault on testnet</h1>
      <p>
        This prototype explores advances against invoice commitments on Stellar.
        A configured verifier approves invoices; a pool finances advances and
        accounts for repayment or loss. Commercial verification, legal
        assignment and collection remain off-chain responsibilities.
      </p>
      <p className="text-amber-300">
        Testnet only, pre-audit. LVTEST is a custom demonstration token, not
        Circle USDC. It has no promised monetary value. Both tranches can lose
        their entire deposit.
      </p>
      <ol className="list-decimal pl-6 space-y-4">
        <li>
          Install Freighter from its official website, create a dedicated test
          wallet and select Testnet. Never share a recovery phrase or secret
          key.
        </li>
        <li>
          Fund the wallet with test XLM using{" "}
          <a className="underline" href="https://lab.stellar.org/account/fund">
            Stellar Lab funding
          </a>
          . XLM pays network fees; it is separate from LVTEST.
        </li>
        <li>
          Obtain LVTEST from the deployment operator before attempting deposits
          or repayment. There is currently no public LVTEST faucet. Share only
          your public address. Alternatively, deploy your own isolated instance
          using the contract deployment guide.
        </li>
        <li>
          <Link className="underline" href="/investor">
            Provide liquidity
          </Link>{" "}
          as senior or junior capital. Read the first-loss risk and the 24-hour
          position lock; each top-up resets the lock for that tranche.
        </li>
        <li>
          <Link className="underline" href="/merchant">
            Mint an invoice
          </Link>{" "}
          with a future maturity, debtor public address and document hash. Use
          synthetic documents only. An authorized verifier must approve it
          before factoring; connecting as a debtor grants no verifier rights.
        </li>
        <li>
          After verifier approval, factor the invoice and inspect the confirmed
          transaction hash. Repayment requires the full face amount of LVTEST;
          the borrower receives less than face value and must obtain the
          difference separately.
        </li>
        <li>
          After the lock expires, check withdrawal eligibility. Idle liquidity,
          pool pause and junior coverage can still prevent redemption.
        </li>
      </ol>
      <h2 className="text-xl font-semibold">Configured contracts</h2>
      <dl className="space-y-3 break-all text-sm font-mono">
        {Object.entries(STELLAR_CONFIG.contracts).map(([name, address]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{address}</dd>
          </div>
        ))}
      </dl>
      <p>
        Refreshes are snapshots. If submission or confirmation is interrupted,
        inspect the transaction hash before retrying; an uncertain response does
        not mean the write failed.
      </p>
      <p>
        <a
          className="underline"
          href="https://github.com/MoscowDev/LiquiVault/blob/main/docs/wallet-demo.md"
        >
          Wallet walkthrough and evidence checklist
        </a>{" "}
        ·{" "}
        <a
          className="underline"
          href="https://github.com/MoscowDev/liquivault-contracts"
        >
          Deploy an isolated test instance
        </a>
      </p>
    </article>
  );
}
