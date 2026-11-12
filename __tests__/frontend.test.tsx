import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { webcrypto } from "node:crypto";
Object.defineProperty(window, "crypto", {
  value: webcrypto,
  configurable: true,
});
import { WalletProvider, useWallet } from "@/context/WalletContext";
import {
  quoteForUI,
  toUnits,
  checkJuniorWithdrawal,
  splitTrancheYield,
} from "@/lib/sdk";
import { RiskTier } from "@liquivault/sdk";
import { formatUSDC, generateInvoiceMetadataHash } from "@/lib/utils";
const fake = vi.hoisted(() => ({
  installed: false,
  fail: false,
  confirmed: false,
  address: "GREAL",
  passphrase: "Test SDF Network ; September 2015",
  balance: null as null | ((address: string) => Promise<bigint>),
  write: null as null | (() => Promise<void>),
}));
vi.mock("@liquivault/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@liquivault/sdk")>();
  return {
    ...actual,
    LiquiVaultSDK: class {
      wallet = {
        isConnected: async () => fake.installed,
        connect: async () => ({
          publicKey: fake.address,
          networkPassphrase: fake.passphrase,
        }),
      };
      liquidityPool = {
        getPoolState: async () => ({
          totalAssets: 1000000000n,
          totalShares: 1000000000n,
          deployedCapital: 0n,
          reserveFactorBps: 1000,
          treasury: "GTREASURY",
        }),
        getJuniorState: async () => ({ totalAssets: 0n, totalShares: 0n }),
        getLPPosition: async () => ({ shares: 0n, depositedUsdc: 0n }),
        getJuniorPosition: async () => ({ shares: 0n, depositedUsdc: 0n }),
        deposit: async () => {
          if (fake.write) await fake.write();
          if (fake.fail) throw new Error("Wallet rejected");
          fake.confirmed = true;
          return {
            txHash: "real-confirmed-hash",
            ledger: 123,
            status: "SUCCESS",
            returnValue: 10000000n,
          };
        },
      };
      invoiceRegistry = { getMerchantInvoices: async () => [] };
      rpc = {
        simulateViewCall: async (
          _contract: string,
          method: string,
          args: string[],
        ) =>
          method === "get_protocol_metrics"
            ? [0n, 0n]
            : method === "get_junior_yield_bps"
              ? 3000
              : fake.balance && method === "balance"
                ? fake.balance(args[0])
                : 0n,
      };
    },
  };
});
function Probe() {
  const wallet = useWallet();
  return (
    <>
      <span>{wallet.isConnected ? "Connected" : "Disconnected"}</span>
      <span>Invoices: {wallet.invoices.length}</span>
      <span>Balance: {wallet.usdcBalance}</span>
      <span>{wallet.lastNotification}</span>
      <span>{wallet.transactions.map((t) => t.txHash).join(",")}</span>
      <button onClick={wallet.connectWallet}>Connect</button>
      <button onClick={wallet.disconnectWallet}>Disconnect</button>
      <button onClick={() => void wallet.depositLiquidity(1).catch(() => {})}>
        Deposit
      </button>
    </>
  );
}
afterEach(() => {
  cleanup();
  fake.installed = false;
  fake.fail = false;
  fake.confirmed = false;
  fake.address = "GREAL";
  fake.passphrase = "Test SDF Network ; September 2015";
  fake.balance = null;
  fake.write = null;
});
describe("real wallet state", () => {
  it("refuses the wrong network", async () => {
    fake.installed = true;
    fake.passphrase = "Public Global Stellar Network ; September 2015";
    render(
      <WalletProvider>
        <Probe />
      </WalletProvider>,
    );
    fireEvent.click(screen.getByText("Connect"));
    await screen.findByText(/Switch Freighter/);
    expect(screen.getByText("Disconnected")).toBeDefined();
  });
  it("ignores a delayed account read after disconnect", async () => {
    fake.installed = true;
    let release!: (value: bigint) => void;
    let requested = false;
    fake.balance = async (address) =>
      address === "GREAL"
        ? new Promise<bigint>((resolve) => {
            release = resolve;
            requested = true;
          })
        : 0n;
    render(
      <WalletProvider>
        <Probe />
      </WalletProvider>,
    );
    fireEvent.click(screen.getByText("Connect"));
    await waitFor(() => expect(requested).toBe(true));
    fireEvent.click(screen.getByText("Disconnect"));
    release(990000000n);
    await waitFor(() => expect(screen.getByText("Balance: 0")).toBeDefined());
    expect(screen.getByText("Disconnected")).toBeDefined();
  });
  it("does not attach a completed old-session write to a new session", async () => {
    fake.installed = true;
    let release!: () => void;
    let requested = false;
    fake.write = () =>
      new Promise<void>((resolve) => {
        release = resolve;
        requested = true;
      });
    render(
      <WalletProvider>
        <Probe />
      </WalletProvider>,
    );
    fireEvent.click(screen.getByText("Connect"));
    await screen.findByText("Connected");
    fireEvent.click(screen.getByText("Deposit"));
    await waitFor(() => expect(requested).toBe(true));
    fireEvent.click(screen.getByText("Disconnect"));
    release();
    await waitFor(() => expect(fake.confirmed).toBe(true));
    expect(screen.queryByText("real-confirmed-hash")).toBeNull();
    expect(screen.queryByText(/Confirmed in ledger/)).toBeNull();
    expect(screen.getByText("Disconnected")).toBeDefined();
  });
  it("starts disconnected without fabricated invoices and refuses a missing extension", async () => {
    render(
      <WalletProvider>
        <Probe />
      </WalletProvider>,
    );
    expect(screen.getByText("Disconnected")).toBeDefined();
    expect(screen.getByText("Invoices: 0")).toBeDefined();
    fireEvent.click(screen.getByText("Connect"));
    await screen.findByText(/Install and unlock Freighter/);
    expect(screen.getByText("Disconnected")).toBeDefined();
  });
  it("records confirmed writes, but leaves rejected writes out of activity", async () => {
    fake.installed = true;
    render(
      <WalletProvider>
        <Probe />
      </WalletProvider>,
    );
    fireEvent.click(screen.getByText("Connect"));
    await screen.findByText("Connected");
    fake.fail = true;
    fireEvent.click(screen.getByText("Deposit"));
    await screen.findByText(/Wallet rejected/);
    expect(screen.queryByText("real-confirmed-hash")).toBeNull();
    fake.fail = false;
    fireEvent.click(screen.getByText("Deposit"));
    await waitFor(() => expect(fake.confirmed).toBe(true));
    await screen.findByText("real-confirmed-hash");
  });
});
it("displays the contract quote including its origination fee and effective 214 bps", () => {
  const q = quoteForUI(
    {
      invoiceId: 1n,
      faceValue: 100000000000n,
      riskTier: RiskTier.TierB,
      durationSeconds: 5183953,
      timeDiscountAmount: 1643820712n,
      originationFeeAmount: 500000000n,
      totalDiscount: 2143820712n,
      netPayout: 97856179288n,
      effectiveDiscountBps: 214,
    },
    1000,
  );
  expect(q.effectiveDiscountBps).toBe(214);
  expect(q.netPayoutUsdc).toBe(9785.6179288);
});
it("converts positive token units and rejects invalid input", () => {
  expect(toUnits(1.25)).toBe(12500000n);
  expect(() => toUnits(NaN)).toThrow();
  expect(() => toUnits(-1)).toThrow();
  expect(formatUSDC(10000000n, true)).toBe("$1.00");
});
it("caps junior yield by capital and enforces first-loss coverage", () => {
  expect(splitTrancheYield(1800, 20000, 3000, 60000)).toEqual({
    juniorYieldUsdc: 450,
    seniorYieldUsdc: 1350,
  });
  expect(checkJuniorWithdrawal(20000, 20000, 50000, 50000).allowed).toBe(false);
});
it("hashes invoice metadata", async () => {
  expect(await generateInvoiceMetadataHash("invoice")).toMatch(
    /^[a-f0-9]{64}$/,
  );
});
