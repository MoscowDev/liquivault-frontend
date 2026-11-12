import { test, expect, type Page } from "@playwright/test";
import {
  Keypair,
  Networks,
  TransactionBuilder,
  SorobanDataBuilder,
  nativeToScVal,
  xdr,
} from "@stellar/stellar-sdk";
const publicKey = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
async function wallet(
  page: Page,
  mode:
    | "missing"
    | "wrong-network"
    | "connected"
    | "rejected"
    | "confirmed"
    | "changed-account"
    | "changed-network"
    | "unknown",
) {
  // Emulates only Freighter's window message protocol. No production test switch.
  await page.addInitScript(
    ({ publicKey, mode }) => {
      let accessRequests = 0;
      window.addEventListener("message", (event) => {
        if (
          event.source !== window ||
          event.data?.source !== "FREIGHTER_EXTERNAL_MSG_REQUEST"
        )
          return;
        const { messageId, type } = event.data;
        let body: object = {};
        if (type === "REQUEST_CONNECTION_STATUS")
          body = { isConnected: mode !== "missing" };
        if (type === "REQUEST_ACCESS") {
          accessRequests++;
          body = {
            publicKey:
              mode === "changed-account" && accessRequests > 1
                ? "GCHANGED"
                : publicKey,
          };
        }
        if (type === "REQUEST_NETWORK_DETAILS")
          body = {
            networkDetails: {
              network: "TESTNET",
              networkUrl: "",
              networkPassphrase:
                mode === "wrong-network" ||
                (mode === "changed-network" && accessRequests > 1)
                  ? "wrong network"
                  : "Test SDF Network ; September 2015",
            },
          };
        if (type === "SUBMIT_TRANSACTION")
          body =
            mode === "confirmed" || mode === "unknown"
              ? { signedTransaction: event.data.transactionXdr }
              : { error: "Wallet rejected" };
        window.postMessage(
          {
            source: "FREIGHTER_EXTERNAL_MSG_RESPONSE",
            messagedId: messageId,
            ...body,
          },
          window.location.origin,
        );
      });
    },
    { publicKey, mode },
  );
  // No test traffic reaches Stellar. RPC failure remains visibly a failure.
  await page.route(
    /https:\/\/(soroban-testnet|horizon-testnet)\.stellar\.org/,
    (route) => route.abort(),
  );
}
test("missing extension stays disconnected and reports installation guidance", async ({
  page,
}) => {
  await wallet(page, "missing");
  await page.goto("/");
  await page
    .getByRole("button", { name: "Connect Freighter", exact: true })
    .click();
  await expect(
    page.getByText("Error: Install and unlock Freighter to connect", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Disconnect Wallet" }),
  ).toHaveCount(0);
});

async function rpcFixture(page: Page, mode: string) {
  let sent = "";
  let submissions = 0;
  const accountEntry = xdr.LedgerEntryData.account(
    new xdr.AccountEntry({
      accountId: Keypair.fromPublicKey(publicKey).xdrPublicKey(),
      balance: 10000000000n,
      seqNum: 12n,
      numSubEntries: 0,
      inflationDest: null,
      flags: 0,
      homeDomain: "",
      thresholds: new Uint8Array([1, 1, 1, 1]),
      signers: [],
      ext: xdr.AccountEntryExt.v0(),
    }),
  ).toXDR("base64");
  await page.route("https://soroban-testnet.stellar.org/**", async (route) => {
    const request = route.request().postDataJSON();
    let result: object;
    if (request.method === "getLedgerEntries")
      result = {
        latestLedger: 123,
        entries: [
          {
            key: request.params.keys[0],
            xdr: accountEntry,
            lastModifiedLedgerSeq: 1,
          },
        ],
      };
    else if (request.method === "simulateTransaction") {
      const tx = TransactionBuilder.fromXDR(
        request.params.transaction,
        Networks.TESTNET,
      );
      const op = tx.operations[0];
      if (
        op.type !== "invokeHostFunction" ||
        op.func.type !== "hostFunctionTypeInvokeContract"
      )
        throw new Error("Expected invocation");
      const method = op.func.invokeContract.functionName.toString();
      const values: Record<string, unknown> = {
        get_pool_state: {
          total_assets: 1000000000n,
          total_shares: 1000000000n,
          deployed_capital: 0n,
          reserve_factor_bps: 1000,
          treasury: publicKey,
          paused: false,
        },
        get_junior_state: { total_assets: 0n, total_shares: 0n },
        get_protocol_metrics: [0n, 0n],
        get_junior_yield_bps: 3000,
        get_position: {
          shares: 0n,
          deposited_usdc: 0n,
          last_deposit_timestamp: 0n,
        },
        get_junior_position: {
          shares: 0n,
          deposited_usdc: 0n,
          last_deposit_timestamp: 0n,
        },
        get_merchant_invoices: [],
        balance: 0n,
        deposit: 1000000000n,
      };
      if (!(method in values))
        throw new Error(`Unexpected fixture method ${method}`);
      result = {
        latestLedger: 123,
        minResourceFee: "1000",
        transactionData: new SorobanDataBuilder()
          .setResourceFee("1000")
          .build()
          .toXDR("base64"),
        results: [
          {
            auth: [],
            xdr: nativeToScVal(
              values[method],
              method === "get_junior_yield_bps" ? { type: "u32" } : undefined,
            ).toXDR("base64"),
          },
        ],
      };
    } else if (request.method === "sendTransaction") {
      submissions++;
      sent = request.params.transaction;
      if (mode === "unknown") {
        await route.abort();
        return;
      }
      result = {
        status: "PENDING",
        hash: "ab".repeat(32),
        latestLedger: 123,
        latestLedgerCloseTime: "1",
      };
    } else if (request.method === "getTransaction")
      result = {
        status: "SUCCESS",
        ledger: 124,
        createdAt: "1",
        applicationOrder: 1,
        feeBump: false,
        envelopeXdr: sent,
        resultXdr: new xdr.TransactionResult({
          feeCharged: 1100n,
          result: xdr.TransactionResultResult.txSuccess([]),
          ext: xdr.TransactionResultExt.v0(),
        }).toXDR("base64"),
        resultMetaXdr: xdr.TransactionMeta.fromXdrObject({
          v: 0,
          operations: [],
        }).toXDR("base64"),
      };
    else throw new Error(`Unexpected RPC method ${request.method}`);
    await route.fulfill({
      json: { jsonrpc: "2.0", id: request.id, result },
      headers: { "access-control-allow-origin": "*" },
    });
  });
  return () => submissions;
}
for (const mode of [
  "rejected",
  "confirmed",
  "changed-account",
  "changed-network",
  "unknown",
] as const) {
  test(`deposit ${mode} follows the production adapter and XDR path`, async ({
    page,
  }) => {
    await wallet(page, mode);
    const submissions = await rpcFixture(page, mode);
    await page.goto("/investor");
    await page
      .getByRole("button", { name: "Connect Freighter", exact: true })
      .click();
    await expect(
      page.getByText("Freighter connected", { exact: true }),
    ).toBeVisible();
    await page.getByLabel("Deposit Amount (USDC)", { exact: true }).fill("100");
    await page
      .locator("form")
      .filter({ has: page.locator("#deposit-usdc-input") })
      .getByRole("button", { name: /Deposit .*Mint/ })
      .click();
    if (mode === "confirmed") {
      await expect(page.getByText(/Confirmed in ledger 124:/)).toBeVisible();
      expect(submissions()).toBe(1);
    } else {
      const message =
        mode === "rejected"
          ? /Wallet rejected/
          : mode === "changed-account"
            ? /Wallet account or network changed/
            : mode === "changed-network"
              ? /Freighter network does not match/
              : /Submission outcome unknown/;
      await expect(page.getByText(message).first()).toBeVisible();
      await expect(page.getByText(/Confirmed in ledger/)).toHaveCount(0);
      expect(submissions()).toBe(mode === "unknown" ? 1 : 0);
    }
  });
}
test("wrong network never connects", async ({ page }) => {
  await wallet(page, "wrong-network");
  await page.goto("/");
  await page
    .getByRole("button", { name: "Connect Freighter", exact: true })
    .click();
  await expect(
    page.getByText(/Freighter network does not match/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Disconnect Wallet" }),
  ).toHaveCount(0);
});
test("real adapter handles connect, unavailable RPC and disconnect without invented balances", async ({
  page,
}) => {
  await wallet(page, "connected");
  await page.goto("/investor");
  await page
    .getByRole("button", { name: "Connect Freighter", exact: true })
    .click();
  await expect(
    page.getByText("Freighter connected", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Contract data unavailable/)).toBeVisible();
  await page.getByRole("button", { name: "Disconnect Wallet" }).click();
  await expect(
    page.getByRole("button", { name: "Connect Freighter", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Freighter connected", { exact: true }),
  ).toHaveCount(0);
});
