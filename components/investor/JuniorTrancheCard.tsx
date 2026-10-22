"use client";

import React, { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { checkJuniorWithdrawal, JUNIOR_MIN_COVERAGE_BPS } from "@/lib/sdk";
import { formatBps, formatUSDC } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Junior (first-loss) tranche: higher yield share, absorbs defaults before senior lvUSDC holders.
 */
export default function JuniorTrancheCard() {
  const {
    poolMetrics,
    usdcBalance,
    juniorSharesBalance,
    juniorDepositedUsdc,
    depositJunior,
    withdrawJunior,
    isSigning,
  } = useWallet();

  const [depositAmount, setDepositAmount] = useState<string>("10000");
  const [withdrawShares, setWithdrawShares] = useState<string>("5000");

  const parsedDeposit = parseFloat(depositAmount) || 0;
  const parsedWithdraw = parseFloat(withdrawShares) || 0;
  const previewRedeemedUsdc = Number(
    (parsedWithdraw * poolMetrics.juniorSharePriceUsdc).toFixed(2)
  );
  const withdrawCheck = checkJuniorWithdrawal(
    previewRedeemedUsdc,
    poolMetrics.juniorLiquidityUsdc,
    poolMetrics.utilizedLiquidityUsdc,
    poolMetrics.availableLiquidityUsdc
  );
  const requiredCoverageUsdc =
    (poolMetrics.utilizedLiquidityUsdc * JUNIOR_MIN_COVERAGE_BPS) / 10000;

  return (
    <Card data-testid="junior-tranche-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-amber-400" />
          Junior First-Loss Tranche
          <Badge variant="info" className="ml-2">
            {formatBps(poolMetrics.juniorYieldBps)} of LP yield
          </Badge>
        </CardTitle>
        <CardDescription>
          Junior capital absorbs invoice defaults before senior lvUSDC holders and earns a
          larger share of yield in return. You can lose your deposit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-3 text-sm">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-400">Junior Capital</p>
            <p className="font-mono text-white">
              {formatUSDC(poolMetrics.juniorLiquidityUsdc)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-400">Your Junior Shares</p>
            <p className="font-mono text-amber-400">
              {juniorSharesBalance.toLocaleString()} jUSDC
            </p>
            <p className="text-xs text-slate-500">
              Principal: {formatUSDC(juniorDepositedUsdc)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-xs text-slate-400">Required Coverage (10% of deployed)</p>
            <p className="font-mono text-slate-200">{formatUSDC(requiredCoverageUsdc)}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (parsedDeposit > 0) await depositJunior(parsedDeposit);
            }}
            className="space-y-3"
          >
            <label
              htmlFor="junior-deposit-input"
              className="text-xs font-medium text-slate-300"
            >
              Junior Deposit (USDC) - Max: {formatUSDC(usdcBalance)}
            </label>
            <Input
              id="junior-deposit-input"
              type="number"
              min="100"
              step="100"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
            />
            <Button type="submit" disabled={isSigning} className="w-full">
              {isSigning
                ? "Signing Soroban Deposit..."
                : `Deposit ${formatUSDC(parsedDeposit)} as First-Loss Capital`}
            </Button>
          </form>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (parsedWithdraw > 0) await withdrawJunior(parsedWithdraw);
            }}
            className="space-y-3"
          >
            <label
              htmlFor="junior-withdraw-input"
              className="text-xs font-medium text-slate-300"
            >
              Redeem Junior Shares (jUSDC)
            </label>
            <Input
              id="junior-withdraw-input"
              type="number"
              min="1"
              step="1"
              value={withdrawShares}
              onChange={(e) => setWithdrawShares(e.target.value)}
              required
            />
            <p
              className={`text-xs ${
                withdrawCheck.allowed ? "text-emerald-400" : "text-amber-400"
              }`}
              data-testid="junior-withdraw-status"
            >
              {withdrawCheck.allowed
                ? `You receive ${formatUSDC(previewRedeemedUsdc)}`
                : `Blocked: ${withdrawCheck.reason}`}
            </p>
            <Button
              type="submit"
              variant="outline"
              disabled={isSigning || !withdrawCheck.allowed}
              className="w-full"
            >
              Redeem {parsedWithdraw.toLocaleString()} jUSDC
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
