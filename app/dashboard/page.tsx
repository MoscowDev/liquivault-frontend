"use client";

import React from "react";
import {
  TrendingUp,
  ShieldAlert,
  Landmark,
  Layers,
  ExternalLink,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBps, formatUSDC, formatAddress } from "@/lib/utils";

export default function DashboardPage() {
  const { poolMetrics, invoices, transactions } = useWallet();

  const utilizationRatio =
    poolMetrics.totalLiquidityUsdc > 0
      ? Number(
          (
            (poolMetrics.utilizedLiquidityUsdc /
              poolMetrics.totalLiquidityUsdc) *
            100
          ).toFixed(1)
        )
      : 0;

  const tierBreakdown = [
    {
      tier: "Tier A (AAA/AA Institutional Debtors)",
      aprBps: 600,
      allocationPct: 58,
      volumeUsdc: 823890,
      badgeVariant: "default" as const,
    },
    {
      tier: "Tier B (Investment Grade Corporate)",
      aprBps: 1000,
      allocationPct: 32,
      volumeUsdc: 454560,
      badgeVariant: "info" as const,
    },
    {
      tier: "Tier C (Verified Mid-Market B2B)",
      aprBps: 1500,
      allocationPct: 10,
      volumeUsdc: 142050,
      badgeVariant: "warning" as const,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Protocol Analytics & Risk Telemetry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time Soroban smart contract state across LiquidityPool,
            InvoiceAsset, and EscrowRouting contracts.
          </p>
        </div>
        <Badge variant="default" className="self-start sm:self-auto py-1 px-3">
          <Activity className="mr-1.5 h-3.5 w-3.5" />
          Soroban Ledger Synced
        </Badge>
      </div>

      {/* Top KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Total Value Locked (TVL)</span>
              <Landmark className="h-4 w-4 text-emerald-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white">
              {formatUSDC(poolMetrics.totalLiquidityUsdc)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              Available:{" "}
              <span className="font-mono text-emerald-400">
                {formatUSDC(poolMetrics.availableLiquidityUsdc)}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Total Volume Factored</span>
              <Layers className="h-4 w-4 text-sky-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white">
              {formatUSDC(poolMetrics.totalFactoredVolumeUsdc)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              Across{" "}
              <span className="font-semibold text-slate-200">
                {invoices.length} active & settled RWA invoices
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Current Pool APY</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-emerald-400">
              {formatBps(poolMetrics.currentApyBps)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              Share Index:{" "}
              <span className="font-mono text-slate-200">
                1 lvUSDC = {poolMetrics.sharePriceUsdc.toFixed(4)} USDC
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>Active Escrows & Default Rate</span>
              <ShieldAlert className="h-4 w-4 text-amber-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-mono text-white">
              {poolMetrics.activeEscrowsCount} Escrows{" "}
              <span className="text-sm font-normal text-emerald-400">
                ({formatBps(poolMetrics.defaultRateBps)} Default)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400">
              Fee Reserve:{" "}
              <span className="font-mono text-slate-200">
                {formatUSDC(poolMetrics.protocolFeeReserveUsdc)}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Utilization & Risk Tier Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Capital Utilization & Reserve Health</CardTitle>
            <CardDescription>
              Real-time allocation between active invoice advances and liquid
              USDC reserves.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-medium">
                  Pool Utilization Ratio
                </span>
                <span className="font-mono font-semibold text-emerald-400">
                  {utilizationRatio}%
                </span>
              </div>
              <Progress value={utilizationRatio} />
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-950/80 p-4 border border-slate-800">
              <div>
                <span className="text-xs text-slate-400">
                  Deployed in Active Receivables
                </span>
                <p className="mt-1 font-mono text-lg font-semibold text-white">
                  {formatUSDC(poolMetrics.utilizedLiquidityUsdc)}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400">
                  Idle Liquid USDC Buffer
                </span>
                <p className="mt-1 font-mono text-lg font-semibold text-emerald-400">
                  {formatUSDC(poolMetrics.availableLiquidityUsdc)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Tier Underwriting Distribution</CardTitle>
            <CardDescription>
              Portfolio exposure segmented by debtor credit rating and base
              annualized discount rate.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tierBreakdown.map((item) => (
              <div key={item.tier} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant={item.badgeVariant}>
                      {formatBps(item.aprBps)} Base APR
                    </Badge>
                    <span className="text-slate-200 font-medium">
                      {item.tier}
                    </span>
                  </div>
                  <span className="font-mono text-slate-300">
                    {formatUSDC(item.volumeUsdc)} ({item.allocationPct}%)
                  </span>
                </div>
                <Progress value={item.allocationPct} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent On-Chain Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Live Soroban Settlement & Factoring Ledger</CardTitle>
          <CardDescription>
            Recent atomic contract invocations across InvoiceAsset,
            LiquidityPool, and EscrowRouting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operation</TableHead>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Signer / Actor</TableHead>
                <TableHead>Amount (USDC)</TableHead>
                <TableHead>Soroban Tx Hash</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-mono text-xs font-semibold text-emerald-300">
                    {tx.type}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {tx.invoiceId ? `#${tx.invoiceId}` : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-300">
                    {tx.actor}
                  </TableCell>
                  <TableCell className="font-mono font-medium text-white">
                    {formatUSDC(tx.amountUsdc)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      {formatAddress(tx.txHash, 6)}
                      <ExternalLink className="h-3 w-3 text-slate-500" />
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {tx.timestamp}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {tx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
