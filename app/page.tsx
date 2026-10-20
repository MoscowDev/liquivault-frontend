"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Landmark,
  ShieldCheck,
  Zap,
  Lock,
  Globe,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBps, formatUSDC } from "@/lib/utils";
import { STELLAR_CONFIG } from "@/lib/sdk";

export default function HomePage() {
  const { poolMetrics } = useWallet();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 p-8 sm:p-12 shadow-2xl">
        <div className="max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">Stellar Soroban RWA Protocol</Badge>
            <Badge variant="info">SEP-10 & SEP-24 Compliant</Badge>
            <Badge variant="secondary">SEP-41 USDC Native</Badge>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Institutional B2B Invoice Factoring &{" "}
            <span className="text-emerald-400">Atomic Liquidity</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            LiquiVault transforms verified net-30 to net-90 corporate trade
            receivables into on-chain Soroban assets, unlocking sub-5-second
            discounted USDC liquidity for global suppliers while delivering
            real-world yield to institutional liquidity providers.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/merchant">
              <Button size="lg" className="gap-2">
                <FileText className="h-4 w-4" />
                Launch Merchant Portal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/investor">
              <Button variant="outline" size="lg" className="gap-2">
                <Landmark className="h-4 w-4 text-emerald-400" />
                Provide USDC Liquidity ({formatBps(poolMetrics.currentApyBps)} APY)
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="lg" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Protocol Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Protocol Snapshot Strip */}
        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-8 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Total Value Locked (TVL)
            </p>
            <p className="mt-1 text-2xl font-bold font-mono text-white">
              {formatUSDC(poolMetrics.totalLiquidityUsdc)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Cumulative Volume Factored
            </p>
            <p className="mt-1 text-2xl font-bold font-mono text-emerald-400">
              {formatUSDC(poolMetrics.totalFactoredVolumeUsdc)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Real-Time LP Yield (APY)
            </p>
            <p className="mt-1 text-2xl font-bold font-mono text-sky-400">
              {formatBps(poolMetrics.currentApyBps)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              lvUSDC Share Index
            </p>
            <p className="mt-1 text-2xl font-bold font-mono text-white">
              {poolMetrics.sharePriceUsdc.toFixed(4)} USDC
            </p>
          </div>
        </div>
      </section>

      {/* Core Modules Grid */}
      <section className="grid gap-6 md:grid-cols-3">
        <Card className="border-slate-800 hover:border-emerald-500/40 transition">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <FileText className="h-5 w-5" />
            </div>
            <CardTitle>1. Invoice Asset Registry</CardTitle>
            <CardDescription>
              Tokenize verified B2B trade receivables with SHA-256 document
              integrity and risk-tier underwriting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-950/90 p-3 font-mono text-xs text-slate-400 border border-slate-800">
              Contract: {STELLAR_CONFIG.contracts.invoiceAsset.slice(0, 18)}...
            </div>
            <Link href="/merchant" className="inline-flex items-center text-sm font-medium text-emerald-400 hover:text-emerald-300">
              Tokenize & Factor Invoices <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-800 hover:border-sky-500/40 transition">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
              <Landmark className="h-5 w-5" />
            </div>
            <CardTitle>2. Liquidity Pool Vault</CardTitle>
            <CardDescription>
              Algorithmic time-to-maturity discount engine and yield-bearing
              lvUSDC LP share accounting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-950/90 p-3 font-mono text-xs text-slate-400 border border-slate-800">
              Contract: {STELLAR_CONFIG.contracts.liquidityPool.slice(0, 18)}...
            </div>
            <Link href="/investor" className="inline-flex items-center text-sm font-medium text-sky-400 hover:text-sky-300">
              Deposit USDC & Earn Yield <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-slate-800 hover:border-amber-500/40 transition">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle>3. Atomic Escrow Router</CardTitle>
            <CardDescription>
              Deterministic repayment routing from corporate debtors back to LP
              reserves and protocol treasury.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-950/90 p-3 font-mono text-xs text-slate-400 border border-slate-800">
              Contract: {STELLAR_CONFIG.contracts.escrowRouting.slice(0, 18)}...
            </div>
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-amber-400 hover:text-amber-300">
              Inspect Active Escrows <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
