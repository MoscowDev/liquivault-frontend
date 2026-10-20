"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Wallet,
  BarChart3,
  FileText,
  Landmark,
  CheckCircle2,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAddress, formatUSDC, cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const {
    isConnected,
    publicKey,
    isSep10Verified,
    usdcBalance,
    connectWallet,
    disconnectWallet,
    sep10Authenticate,
    isSigning,
    lastNotification,
    clearNotification,
  } = useWallet();

  const navItems = [
    { href: "/dashboard", label: "Protocol Analytics", icon: BarChart3 },
    { href: "/merchant", label: "Merchant Factoring", icon: FileText },
    { href: "/investor", label: "Liquidity Vault (LP)", icon: Landmark },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">
                Liqui<span className="text-emerald-400">Vault</span>
              </span>
              <span className="ml-2 hidden rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300 sm:inline-block">
                Soroban RWA
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <Badge variant="info" className="hidden lg:inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            Stellar Soroban Testnet
          </Badge>

          {isConnected && (
            <button
              type="button"
              onClick={sep10Authenticate}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition"
              title="SEP-10 Institutional KYB Session"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              {isSep10Verified ? "SEP-10 KYB Verified" : "Verify SEP-10"}
            </button>
          )}

          {isConnected && publicKey ? (
            <div className="flex items-center space-x-2">
              <div className="hidden xl:flex flex-col items-end px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400">Wallet USDC</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {formatUSDC(usdcBalance)}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-xs border-emerald-500/40 bg-slate-900/90 text-slate-100"
              >
                <Wallet className="mr-1.5 h-3.5 w-3.5 text-emerald-400" />
                {formatAddress(publicKey, 5)}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                aria-label="Disconnect Wallet"
              >
                <LogOut className="h-4 w-4 text-slate-400 hover:text-red-400" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={connectWallet}
              disabled={isSigning}
              className="gap-1.5"
            >
              <Wallet className="h-4 w-4" />
              {isSigning ? "Connecting..." : "Connect Freighter"}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden border-t border-slate-800/80 bg-slate-950 px-4 py-2 justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                active
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Live On-Chain Transaction Toast Banner */}
      {lastNotification && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{lastNotification}</span>
            </div>
            <button
              type="button"
              onClick={clearNotification}
              className="text-emerald-400 hover:text-emerald-200 font-medium ml-4"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
