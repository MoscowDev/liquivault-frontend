"use client";

import React, { useState } from "react";
import {
  Landmark,
  TrendingUp,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { formatBps, formatUSDC } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InvestorPage() {
  const {
    poolMetrics,
    usdcBalance,
    lpSharesBalance,
    depositedUsdc,
    earnedYieldUsdc,
    depositLiquidity,
    withdrawLiquidity,
    isSigning,
  } = useWallet();

  const [depositAmount, setDepositAmount] = useState<string>("25000");
  const [withdrawShares, setWithdrawShares] = useState<string>("10000");

  const parsedDeposit = parseFloat(depositAmount) || 0;
  const previewMintedShares =
    poolMetrics.sharePriceUsdc > 0
      ? Number((parsedDeposit / poolMetrics.sharePriceUsdc).toFixed(2))
      : 0;

  const parsedWithdraw = parseFloat(withdrawShares) || 0;
  const previewRedeemedUsdc = Number(
    (parsedWithdraw * poolMetrics.sharePriceUsdc).toFixed(2)
  );

  const utilizationPct =
    poolMetrics.totalLiquidityUsdc > 0
      ? Number(
          (
            (poolMetrics.utilizedLiquidityUsdc /
              poolMetrics.totalLiquidityUsdc) *
            100
          ).toFixed(1)
        )
      : 0;

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedDeposit <= 0) return;
    await depositLiquidity(parsedDeposit);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedWithdraw <= 0) return;
    await withdrawLiquidity(parsedWithdraw);
  };

  const totalPositionValueUsdc = Number(
    (lpSharesBalance * poolMetrics.sharePriceUsdc).toFixed(2)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Institutional USDC Liquidity Vault (LP)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Supply SEP-41 USDC to fund short-duration B2B invoice advances and
            earn real-world factoring yield via lvUSDC shares.
          </p>
        </div>
        <Badge variant="info" className="self-start sm:self-auto py-1 px-3">
          <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
          Current Pool APY: {formatBps(poolMetrics.currentApyBps)}
        </Badge>
      </div>

      {/* LP Portfolio KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Your Position Value</span>
              <Landmark className="h-4 w-4 text-emerald-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white">
              {formatUSDC(totalPositionValueUsdc)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              Principal Deposited: {formatUSDC(depositedUsdc)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>lvUSDC LP Shares Balance</span>
              <Coins className="h-4 w-4 text-sky-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-sky-400">
              {lpSharesBalance.toLocaleString()} lvUSDC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              Exchange Rate: 1 lvUSDC ={" "}
              <span className="font-mono text-slate-200">
                {poolMetrics.sharePriceUsdc.toFixed(4)} USDC
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Accrued RWA Factoring Yield</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-emerald-400">
              +{formatUSDC(earnedYieldUsdc)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              90% of invoice discounts auto-compound into lvUSDC
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Available Wallet Balance</span>
              <Wallet className="h-4 w-4 text-slate-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white">
              {formatUSDC(usdcBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              SEP-41 Native Circle USDC on Soroban
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Vault Action & Telemetry Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Manage Vault Liquidity</CardTitle>
            <CardDescription>
              Deposit USDC to mint yield-bearing lvUSDC shares or burn lvUSDC to
              redeem principal plus accrued factoring yield.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deposit">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="deposit">
                  <ArrowDownLeft className="mr-1.5 h-4 w-4" />
                  Deposit USDC
                </TabsTrigger>
                <TabsTrigger value="withdraw">
                  <ArrowUpRight className="mr-1.5 h-4 w-4" />
                  Withdraw / Redeem lvUSDC
                </TabsTrigger>
              </TabsList>

              <TabsContent value="deposit" className="space-y-4 pt-2">
                <form onSubmit={handleDeposit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <label
                        htmlFor="deposit-usdc-input"
                        className="font-medium text-slate-300"
                      >
                        Deposit Amount (USDC)
                      </label>
                      <button
                        type="button"
                        onClick={() => setDepositAmount(String(usdcBalance))}
                        className="text-emerald-400 hover:underline font-mono"
                      >
                        Max: {formatUSDC(usdcBalance)}
                      </button>
                    </div>
                    <Input
                      id="deposit-usdc-input"
                      type="number"
                      min="100"
                      step="100"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Share Index</span>
                      <span className="font-mono text-slate-200">
                        1 lvUSDC = {poolMetrics.sharePriceUsdc.toFixed(4)} USDC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        lvUSDC Shares to be Minted
                      </span>
                      <span className="font-mono font-semibold text-emerald-400">
                        {previewMintedShares.toLocaleString()} lvUSDC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Projected APY</span>
                      <span className="font-mono text-sky-400">
                        {formatBps(poolMetrics.currentApyBps)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSigning}
                    className="w-full gap-2"
                  >
                    <Landmark className="h-4 w-4" />
                    {isSigning
                      ? "Signing Soroban Deposit..."
                      : `Deposit ${formatUSDC(parsedDeposit)} & Mint lvUSDC`}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="withdraw" className="space-y-4 pt-2">
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <label
                        htmlFor="withdraw-shares-input"
                        className="font-medium text-slate-300"
                      >
                        Redeem Shares Amount (lvUSDC)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setWithdrawShares(String(lpSharesBalance))
                        }
                        className="text-sky-400 hover:underline font-mono"
                      >
                        Max: {lpSharesBalance.toLocaleString()} lvUSDC
                      </button>
                    </div>
                    <Input
                      id="withdraw-shares-input"
                      type="number"
                      min="10"
                      step="10"
                      value={withdrawShares}
                      onChange={(e) => setWithdrawShares(e.target.value)}
                      required
                    />
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Redemption Rate</span>
                      <span className="font-mono text-slate-200">
                        1 lvUSDC = {poolMetrics.sharePriceUsdc.toFixed(4)} USDC
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Total USDC to Receive
                      </span>
                      <span className="font-mono font-semibold text-emerald-400">
                        {formatUSDC(previewRedeemedUsdc)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isSigning}
                    className="w-full gap-2 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    {isSigning
                      ? "Signing Soroban Withdrawal..."
                      : `Burn ${parsedWithdraw.toLocaleString()} lvUSDC for ${formatUSDC(
                          previewRedeemedUsdc
                        )}`}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Vault Protection & Reserve Architecture */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Vault Protection & Reserve Telemetry
            </CardTitle>
            <CardDescription>
              On-chain solvency parameters enforced by the Soroban LiquidityPool
              contract.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Current Utilization</span>
                <span className="font-mono text-slate-200">
                  {utilizationPct}%
                </span>
              </div>
              <Progress value={utilizationPct} />
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Total Pool Liquidity</span>
                <span className="font-mono text-white">
                  {formatUSDC(poolMetrics.totalLiquidityUsdc)}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Active Invoice Advances</span>
                <span className="font-mono text-sky-400">
                  {formatUSDC(poolMetrics.utilizedLiquidityUsdc)}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Liquid Withdrawal Buffer</span>
                <span className="font-mono text-emerald-400">
                  {formatUSDC(poolMetrics.availableLiquidityUsdc)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">First-Loss Fee Reserve</span>
                <span className="font-mono text-amber-400">
                  {formatUSDC(poolMetrics.protocolFeeReserveUsdc)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
