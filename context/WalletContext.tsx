"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { TransactionResult } from "@liquivault/sdk";
import {
  createSDK,
  fromUnits,
  toUnits,
  fromSDKRiskTier,
  toSDKRiskTier,
  quoteForUI,
  INITIAL_POOL_METRICS,
  STELLAR_CONFIG,
  type DiscountQuote,
  type RiskTier,
  type UIInvoice,
  type UIPoolMetrics,
  type UIProtocolTransaction,
} from "@/lib/sdk";

export interface MintInvoiceInput {
  invoiceRef: string;
  debtorName: string;
  debtorAddress: string;
  amountUsdc: number;
  maturityTimestamp: number;
  riskTier: RiskTier;
  metadataHash: string;
}

export interface WalletContextType {
  isConnected: boolean;
  publicKey: string | null;
  network: string;
  usdcBalance: number;
  lpSharesBalance: number;
  juniorSharesBalance: number;
  juniorDepositedUsdc: number;
  depositedUsdc: number;
  earnedYieldUsdc: number;
  seniorLastDepositTimestamp: number;
  juniorLastDepositTimestamp: number;
  redemptionSnapshot: {
    seniorAssets: bigint;
    seniorShares: bigint;
    juniorAssets: bigint;
    juniorShares: bigint;
    deployed: bigint;
    seniorPosition: bigint;
    juniorPosition: bigint;
    paused: boolean;
  } | null;
  invoices: UIInvoice[];
  transactions: UIProtocolTransaction[];
  poolMetrics: UIPoolMetrics;
  quotes: Record<number, DiscountQuote>;
  dataStatus: string;
  isSigning: boolean;
  lastNotification: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  mintInvoice: (input: MintInvoiceInput) => Promise<UIInvoice>;
  factorInvoice: (invoiceId: number) => Promise<void>;
  settleInvoice: (invoiceId: number) => Promise<void>;
  verifyInvoice: (invoiceId: bigint, tier: RiskTier) => Promise<void>;
  depositLiquidity: (amountUsdc: number) => Promise<void>;
  withdrawLiquidity: (sharesAmount: number) => Promise<void>;
  depositJunior: (amountUsdc: number) => Promise<void>;
  withdrawJunior: (sharesAmount: number) => Promise<void>;
  clearNotification: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);
const sdk = createSDK();
const emptyAccount: Pick<
  WalletContextType,
  | "usdcBalance"
  | "lpSharesBalance"
  | "juniorSharesBalance"
  | "juniorDepositedUsdc"
  | "depositedUsdc"
  | "earnedYieldUsdc"
  | "seniorLastDepositTimestamp"
  | "juniorLastDepositTimestamp"
  | "redemptionSnapshot"
> = {
  usdcBalance: 0,
  lpSharesBalance: 0,
  juniorSharesBalance: 0,
  juniorDepositedUsdc: 0,
  depositedUsdc: 0,
  earnedYieldUsdc: 0,
  seniorLastDepositTimestamp: 0,
  juniorLastDepositTimestamp: 0,
  redemptionSnapshot: null,
};
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [account, setAccount] = useState(emptyAccount);
  const [invoices, setInvoices] = useState<UIInvoice[]>([]);
  const [transactions, setTransactions] = useState<UIProtocolTransaction[]>([]);
  const [poolMetrics, setPoolMetrics] =
    useState<UIPoolMetrics>(INITIAL_POOL_METRICS);
  const [quotes, setQuotes] = useState<Record<number, DiscountQuote>>({});
  const [isSigning, setIsSigning] = useState(false);
  const [lastNotification, setLastNotification] = useState<string | null>(null);
  const [dataStatus, setDataStatus] = useState("Loading contract state...");
  const session = useRef(0);
  const refreshGeneration = useRef(0);
  const addressRef = useRef<string | null>(null);
  const busy = useRef(false);

  const load = useCallback(
    async (address: string | null, active: () => boolean = () => true) => {
      const generation = ++refreshGeneration.current;
      const currentSession = session.current;
      const isCurrent = () =>
        active() &&
        currentSession === session.current &&
        generation === refreshGeneration.current;
      const [pool, junior, metrics, yieldBps, treasury] = await Promise.all([
        sdk.liquidityPool.getPoolState(),
        sdk.liquidityPool.getJuniorState(),
        sdk.rpc.simulateViewCall<[bigint, bigint]>(
          STELLAR_CONFIG.contracts.escrowRouting,
          "get_protocol_metrics",
          [],
        ),
        sdk.rpc
          .simulateViewCall<number>(
            STELLAR_CONFIG.contracts.liquidityPool,
            "get_junior_yield_bps",
            [],
          )
          .catch(() => null),
        sdk.liquidityPool
          .getPoolState()
          .then((p) =>
            sdk.rpc.simulateViewCall<bigint>(
              STELLAR_CONFIG.contracts.usdcToken,
              "balance",
              [p.treasury],
            ),
          ),
      ]);
      if (!isCurrent()) return;
      setPoolMetrics({
        ...INITIAL_POOL_METRICS,
        totalLiquidityUsdc: fromUnits(pool.totalAssets + junior.totalAssets),
        utilizedLiquidityUsdc: fromUnits(pool.deployedCapital),
        availableLiquidityUsdc: fromUnits(
          pool.totalAssets + junior.totalAssets - pool.deployedCapital,
        ),
        totalFactoredVolumeUsdc: fromUnits(metrics[0]),
        activeEscrowsCount: Number(metrics[1]),
        protocolFeeReserveUsdc: fromUnits(treasury),
        totalLpShares: fromUnits(pool.totalShares),
        sharePriceUsdc: pool.totalShares
          ? Number(pool.totalAssets) / Number(pool.totalShares)
          : 1,
        juniorLiquidityUsdc: fromUnits(junior.totalAssets),
        juniorSharePriceUsdc: junior.totalShares
          ? Number(junior.totalAssets) / Number(junior.totalShares)
          : 1,
        juniorYieldBps:
          yieldBps === null
            ? null
            : Math.min(
                yieldBps,
                junior.totalAssets
                  ? Number(
                      (junior.totalAssets * 10000n) /
                        (junior.totalAssets + pool.totalAssets),
                    )
                  : 0,
              ),
      });
      if (address) {
        const [seniorPos, juniorPos, balance, ids] = await Promise.all([
          sdk.liquidityPool.getLPPosition(address),
          sdk.liquidityPool.getJuniorPosition(address),
          sdk.rpc.simulateViewCall<bigint>(
            STELLAR_CONFIG.contracts.usdcToken,
            "balance",
            [address],
          ),
          sdk.invoiceRegistry.getMerchantInvoices(address),
        ]);
        const records = await Promise.all(
          ids.map((id) => sdk.invoiceRegistry.getInvoice(id)),
        );
        const nextQuotes: Record<number, DiscountQuote> = {};
        await Promise.all(
          records
            .filter(
              (r) =>
                r.status === "Verified" &&
                r.maturityTimestamp > Date.now() / 1000,
            )
            .map(async (r) => {
              nextQuotes[Number(r.invoiceId)] = quoteForUI(
                await sdk.factoringEscrow.previewFactoringQuote(r.invoiceId),
                pool.reserveFactorBps,
              );
            }),
        );
        if (!isCurrent()) return;
        setQuotes(nextQuotes);
        setInvoices(
          records.map((r) => ({
            id: Number(r.invoiceId),
            invoiceRef: r.invoiceNumber,
            merchantAddress: r.merchant,
            debtorName: r.debtor,
            debtorAddress: r.debtor,
            amountUsdc: fromUnits(r.faceValue),
            maturityTimestamp: r.maturityTimestamp,
            riskTier: fromSDKRiskTier(r.riskTier),
            metadataHash: r.metadataHash,
            status: r.status,
            txHash: "",
          })),
        );
        const value = pool.totalShares
          ? (seniorPos.shares * pool.totalAssets) / pool.totalShares
          : 0n;
        setAccount({
          usdcBalance: fromUnits(balance),
          lpSharesBalance: fromUnits(seniorPos.shares),
          juniorSharesBalance: fromUnits(juniorPos.shares),
          juniorDepositedUsdc: fromUnits(juniorPos.depositedUsdc),
          depositedUsdc: fromUnits(seniorPos.depositedUsdc),
          earnedYieldUsdc: fromUnits(value - seniorPos.depositedUsdc),
          seniorLastDepositTimestamp: seniorPos.lastDepositTimestamp,
          juniorLastDepositTimestamp: juniorPos.lastDepositTimestamp,
          redemptionSnapshot: {
            seniorAssets: pool.totalAssets,
            seniorShares: pool.totalShares,
            juniorAssets: junior.totalAssets,
            juniorShares: junior.totalShares,
            deployed: pool.deployedCapital,
            seniorPosition: seniorPos.shares,
            juniorPosition: juniorPos.shares,
            paused: pool.paused,
          },
        });
      }
      if (isCurrent())
        setDataStatus(
          `Contract snapshot: ${new Date().toLocaleTimeString()}. APY/default-rate history unavailable. Activity shows this session only.`,
        );
    },
    [],
  );

  useEffect(() => {
    let active = true;
    async function refresh() {
      const generation = refreshGeneration.current + 1;
      const currentSession = session.current;
      try {
        await load(publicKey, () => active);
      } catch (e) {
        if (
          active &&
          currentSession === session.current &&
          generation === refreshGeneration.current
        )
          setDataStatus(`Contract data unavailable: ${String(e)}`);
      }
    }
    void refresh();
    const timer = setInterval(refresh, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [publicKey, load]);

  async function connectWallet() {
    if (busy.current) return;
    const currentSession = ++session.current;
    busy.current = true;
    setIsSigning(true);
    try {
      if (!(await sdk.wallet.isConnected()))
        throw new Error("Install and unlock Freighter to connect");
      const connection = await sdk.wallet.connect();
      if (connection.networkPassphrase !== STELLAR_CONFIG.networkPassphrase)
        throw new Error("Switch Freighter to the configured Stellar network");
      if (currentSession !== session.current) return;
      addressRef.current = connection.publicKey;
      setAccount(emptyAccount);
      setInvoices([]);
      setQuotes({});
      setTransactions([]);
      setPublicKey(connection.publicKey);
      setLastNotification("Freighter connected");
    } catch (e) {
      if (currentSession === session.current) setLastNotification(String(e));
    } finally {
      busy.current = false;
      if (currentSession === session.current) setIsSigning(false);
    }
  }
  function disconnectWallet() {
    session.current++;
    refreshGeneration.current++;
    addressRef.current = null;
    setLastNotification(null);
    setIsSigning(false);
    setPublicKey(null);
    setAccount(emptyAccount);
    setInvoices([]);
    setQuotes({});
    setTransactions([]);
  }
  function requireAddress() {
    if (!addressRef.current || addressRef.current !== publicKey)
      throw new Error("Connect Freighter first");
    return addressRef.current;
  }
  async function sign(xdr: string) {
    const currentSession = session.current;
    const actor = requireAddress();
    const connection = await sdk.wallet.connect();
    if (
      currentSession !== session.current ||
      connection.publicKey !== actor ||
      connection.networkPassphrase !== STELLAR_CONFIG.networkPassphrase
    )
      throw new Error("Wallet account or network changed; reconnect");
    const signed = await sdk.wallet.signTransaction(xdr, actor);
    if (currentSession !== session.current || addressRef.current !== actor)
      throw new Error(
        "Wallet session changed during signing; transaction was not submitted",
      );
    return signed;
  }
  async function execute<T>(
    type: UIProtocolTransaction["type"],
    amount: number,
    call: () => Promise<TransactionResult<T>>,
    invoiceId?: number,
  ) {
    if (busy.current) throw new Error("Wait for the current wallet operation");
    const currentSession = session.current;
    busy.current = true;
    setIsSigning(true);
    try {
      const actor = requireAddress();
      const result = await call();
      if (currentSession !== session.current || actor !== addressRef.current)
        return result;
      setTransactions((prev) => [
        {
          id: result.txHash,
          type,
          actor,
          amountUsdc: amount,
          invoiceId,
          timestamp: new Date().toLocaleTimeString(),
          txHash: result.txHash,
          status: "FINALIZED",
        },
        ...prev,
      ]);
      setLastNotification(
        `Confirmed in ledger ${result.ledger}: ${result.txHash}`,
      );
      try {
        await load(actor, () => currentSession === session.current);
      } catch (e) {
        if (currentSession === session.current)
          setDataStatus(`Transaction confirmed; refresh failed: ${String(e)}`);
      }
      return result;
    } catch (e) {
      if (currentSession === session.current) setLastNotification(String(e));
      throw e;
    } finally {
      busy.current = false;
      if (currentSession === session.current) setIsSigning(false);
    }
  }
  async function mintInvoice(input: MintInvoiceInput): Promise<UIInvoice> {
    const merchant = requireAddress();
    const result = await execute("MINT_INVOICE", input.amountUsdc, () =>
      sdk.invoiceRegistry.createInvoice(
        {
          merchant,
          debtor: input.debtorAddress,
          faceValue: toUnits(input.amountUsdc),
          maturityTimestamp: input.maturityTimestamp,
          riskTier: toSDKRiskTier(input.riskTier),
          metadataHash: input.metadataHash,
          invoiceNumber: input.invoiceRef,
        },
        sign,
      ),
    );
    return {
      id: Number(result.returnValue),
      invoiceRef: input.invoiceRef,
      merchantAddress: merchant,
      debtorName: input.debtorName,
      debtorAddress: input.debtorAddress,
      amountUsdc: input.amountUsdc,
      maturityTimestamp: input.maturityTimestamp,
      riskTier: input.riskTier,
      metadataHash: input.metadataHash,
      status: "Issued",
      txHash: result.txHash,
    };
  }
  const factorInvoice = async (id: number) => {
    await execute(
      "FACTOR_INVOICE",
      quotes[id]?.netPayoutUsdc ?? 0,
      () =>
        sdk.factoringEscrow.factorInvoice(requireAddress(), BigInt(id), sign),
      id,
    );
  };
  const settleInvoice = async (id: number) => {
    await execute(
      "SETTLE_ESCROW",
      invoices.find((i) => i.id === id)?.amountUsdc ?? 0,
      () =>
        sdk.factoringEscrow.settleInvoice(requireAddress(), BigInt(id), sign),
      id,
    );
  };
  const verifyInvoice = async (id: bigint, tier: RiskTier) => {
    await execute("VERIFY_INVOICE", 0, () =>
      sdk.invoiceRegistry.verifyInvoice(
        requireAddress(),
        id,
        toSDKRiskTier(tier),
        sign,
      ),
    );
  };
  const depositLiquidity = async (amount: number) => {
    await execute("LP_DEPOSIT", amount, () =>
      sdk.liquidityPool.deposit(requireAddress(), toUnits(amount), sign),
    );
  };
  const withdrawLiquidity = async (amount: number) => {
    await execute("LP_WITHDRAW", amount, () =>
      sdk.liquidityPool.withdraw(requireAddress(), toUnits(amount), sign),
    );
  };
  const depositJunior = async (amount: number) => {
    await execute("LP_DEPOSIT", amount, () =>
      sdk.liquidityPool.depositJunior(requireAddress(), toUnits(amount), sign),
    );
  };
  const withdrawJunior = async (amount: number) => {
    await execute("LP_WITHDRAW", amount, () =>
      sdk.liquidityPool.withdrawJunior(requireAddress(), toUnits(amount), sign),
    );
  };
  return (
    <WalletContext.Provider
      value={{
        isConnected: !!publicKey,
        publicKey,
        network: STELLAR_CONFIG.network,
        ...account,
        invoices,
        transactions,
        poolMetrics,
        quotes,
        dataStatus,
        isSigning,
        lastNotification,
        connectWallet,
        disconnectWallet,
        mintInvoice,
        factorInvoice,
        settleInvoice,
        verifyInvoice,
        depositLiquidity,
        withdrawLiquidity,
        depositJunior,
        withdrawJunior,
        clearNotification: () => setLastNotification(null),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context)
    throw new Error("useWallet must be used within a WalletProvider");
  return context;
}
