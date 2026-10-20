"use client";

import React, { useState } from "react";
import {
  FilePlus2,
  Hash,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Calculator,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import {
  RiskTier,
  UIInvoice,
  calculateFactoringQuote,
  RISK_TIER_RATES_BPS,
} from "@/lib/sdk";
import {
  formatAddress,
  formatBps,
  formatDate,
  formatUSDC,
  generateInvoiceMetadataHash,
  getDaysToMaturity,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function MerchantPage() {
  const { invoices, mintInvoice, factorInvoice, settleInvoice, isSigning } =
    useWallet();

  // Form state for minting a new RWA invoice
  const [invoiceRef, setInvoiceRef] = useState("INV-2025-8904");
  const [debtorName, setDebtorName] = useState("Bosch Global Industrial GmbH");
  const [debtorAddress, setDebtorAddress] = useState(
    "GB4BOSCH9GLOBAL7INDUSTRIAL3SOROBAN6DEBTOR2TREASURY8X1K"
  );
  const [amountUsdc, setAmountUsdc] = useState("75000");
  const [daysUntilMaturity, setDaysUntilMaturity] = useState("45");
  const [riskTier, setRiskTier] = useState<RiskTier>("Tier A");
  const [metadataHash, setMetadataHash] = useState(
    "7c4a8d09ca3762af61e59520943dc26494f8941b88a1e72b92f4d9e81234abcd"
  );

  // Selected invoice for factoring modal
  const [selectedInvoice, setSelectedInvoice] = useState<UIInvoice | null>(
    null
  );

  const handleGenerateHash = async () => {
    const payload = `${invoiceRef}|${debtorName}|${debtorAddress}|${amountUsdc}|${daysUntilMaturity}|${riskTier}|${Date.now()}`;
    const digest = await generateInvoiceMetadataHash(payload);
    setMetadataHash(digest);
  };

  const handleMintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amountUsdc) || 50000;
    const days = parseInt(daysUntilMaturity, 10) || 45;
    const maturityTimestamp = Math.floor(Date.now() / 1000) + days * 86400;

    await mintInvoice({
      invoiceRef,
      debtorName,
      debtorAddress,
      amountUsdc: numericAmount,
      maturityTimestamp,
      riskTier,
      metadataHash,
    });

    // Advance reference number for convenience
    const nextNum = Math.floor(8905 + Math.random() * 90);
    setInvoiceRef(`INV-2025-${nextNum}`);
  };

  const activeQuote = selectedInvoice
    ? calculateFactoringQuote(
        selectedInvoice.amountUsdc,
        selectedInvoice.maturityTimestamp,
        selectedInvoice.riskTier
      )
    : null;

  const handleConfirmFactor = async () => {
    if (!selectedInvoice) return;
    await factorInvoice(selectedInvoice.id);
    setSelectedInvoice(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Merchant Receivable Tokenization & Factoring
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Mint verified B2B trade invoices on Soroban and factor them for
            instant discounted USDC liquidity.
          </p>
        </div>
        <Badge variant="default" className="self-start sm:self-auto py-1 px-3">
          <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
          SEP-10 Merchant KYB Active
        </Badge>
      </div>

      {/* Tokenize New Trade Receivable Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePlus2 className="h-5 w-5 text-emerald-400" />
            Tokenize Trade Receivable (InvoiceAsset Contract)
          </CardTitle>
          <CardDescription>
            Anchor an immutable SHA-256 invoice commitment and mint an on-chain
            Soroban receivable claim.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleMintSubmit}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="invoice-ref"
                className="text-xs font-medium text-slate-300"
              >
                Invoice Reference Number
              </label>
              <Input
                id="invoice-ref"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                placeholder="INV-2025-8904"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="debtor-name"
                className="text-xs font-medium text-slate-300"
              >
                Corporate Debtor Legal Name
              </label>
              <Input
                id="debtor-name"
                value={debtorName}
                onChange={(e) => setDebtorName(e.target.value)}
                placeholder="Siemens Energy Global GmbH"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="debtor-address"
                className="text-xs font-medium text-slate-300"
              >
                Debtor Stellar Account (G...)
              </label>
              <Input
                id="debtor-address"
                value={debtorAddress}
                onChange={(e) => setDebtorAddress(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="invoice-amount"
                className="text-xs font-medium text-slate-300"
              >
                Face Value Amount (USDC)
              </label>
              <Input
                id="invoice-amount"
                type="number"
                min="1000"
                step="100"
                value={amountUsdc}
                onChange={(e) => setAmountUsdc(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="maturity-days"
                className="text-xs font-medium text-slate-300"
              >
                Payment Terms (Days to Maturity)
              </label>
              <Select
                id="maturity-days"
                value={daysUntilMaturity}
                onChange={(e) => setDaysUntilMaturity(e.target.value)}
              >
                <option value="30">Net 30 Days</option>
                <option value="45">Net 45 Days</option>
                <option value="60">Net 60 Days</option>
                <option value="75">Net 75 Days</option>
                <option value="90">Net 90 Days</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="risk-tier"
                className="text-xs font-medium text-slate-300"
              >
                Underwriting Risk Tier
              </label>
              <Select
                id="risk-tier"
                value={riskTier}
                onChange={(e) => setRiskTier(e.target.value as RiskTier)}
              >
                <option value="Tier A">
                  Tier A — 6.00% Base APR (Institutional AAA/AA)
                </option>
                <option value="Tier B">
                  Tier B — 10.00% Base APR (Investment Grade)
                </option>
                <option value="Tier C">
                  Tier C — 15.00% Base APR (Mid-Market B2B)
                </option>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label
                htmlFor="metadata-hash"
                className="text-xs font-medium text-slate-300"
              >
                Document SHA-256 Metadata Hash (32-Byte Hex Commitment)
              </label>
              <div className="flex gap-2">
                <Input
                  id="metadata-hash"
                  value={metadataHash}
                  onChange={(e) => setMetadataHash(e.target.value)}
                  className="font-mono text-xs"
                  required
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGenerateHash}
                  className="shrink-0 gap-1.5"
                >
                  <Hash className="h-3.5 w-3.5" />
                  Compute SHA-256
                </Button>
              </div>
            </div>

            <div className="flex items-end">
              <Button
                type="submit"
                disabled={isSigning}
                className="w-full gap-2"
              >
                <FilePlus2 className="h-4 w-4" />
                {isSigning
                  ? "Signing Soroban Transaction..."
                  : "Mint & Verify RWA Invoice"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active & Historical Receivables Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tokenized Trade Receivables Registry</CardTitle>
          <CardDescription>
            Select any verified invoice to preview its live algorithmic discount
            quote and execute atomic USDC factoring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID / Ref</TableHead>
                <TableHead>Corporate Debtor</TableHead>
                <TableHead>Face Value</TableHead>
                <TableHead>Maturity</TableHead>
                <TableHead>Risk Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Protocol Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                const daysLeft = getDaysToMaturity(inv.maturityTimestamp);
                const previewQuote = calculateFactoringQuote(
                  inv.amountUsdc,
                  inv.maturityTimestamp,
                  inv.riskTier
                );
                return (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <div className="font-mono font-semibold text-white">
                        #{inv.id}
                      </div>
                      <div className="text-xs text-slate-400">
                        {inv.invoiceRef}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-200">
                        {inv.debtorName}
                      </div>
                      <div className="font-mono text-xs text-slate-500">
                        {formatAddress(inv.debtorAddress, 6)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-semibold text-white">
                      {formatUSDC(inv.amountUsdc)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-200">
                        {formatDate(inv.maturityTimestamp)}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {daysLeft}d remaining
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inv.riskTier === "Tier A"
                            ? "default"
                            : inv.riskTier === "Tier B"
                            ? "info"
                            : "warning"
                        }
                      >
                        {inv.riskTier} ({formatBps(RISK_TIER_RATES_BPS[inv.riskTier])})
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inv.status === "Settled"
                            ? "default"
                            : inv.status === "Factored"
                            ? "info"
                            : "warning"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.status === "Verified" || inv.status === "Issued" ? (
                        <Button
                          size="sm"
                          onClick={() => setSelectedInvoice(inv)}
                          className="gap-1.5"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          Factor for {formatUSDC(previewQuote.netPayoutUsdc)}
                        </Button>
                      ) : inv.status === "Factored" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => settleInvoice(inv.id)}
                          disabled={isSigning}
                          className="gap-1.5 border-sky-500/40 text-sky-300 hover:bg-sky-500/15"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Simulate Debtor Settlement
                        </Button>
                      ) : (
                        <span className="text-xs font-mono text-slate-500">
                          Escrow #{inv.escrowId} Settled
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Instant USDC Factoring Quote Modal */}
      <Dialog
        open={Boolean(selectedInvoice)}
        onOpenChange={(open) => {
          if (!open) setSelectedInvoice(null);
        }}
      >
        {selectedInvoice && activeQuote && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-400" />
                Atomic USDC Factoring Quote — Invoice #{selectedInvoice.id}
              </DialogTitle>
              <DialogDescription>
                LiquidityPool contract calculates time-weighted discount based on{" "}
                {selectedInvoice.riskTier} underwriting and{" "}
                {activeQuote.daysToMaturity} days to maturity.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Debtor</span>
                <span className="font-medium text-white">
                  {selectedInvoice.debtorName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Face Value</span>
                <span className="font-mono font-semibold text-white">
                  {formatUSDC(activeQuote.faceValueUsdc)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  Effective Time-Weighted Discount ({activeQuote.daysToMaturity}d @{" "}
                  {formatBps(activeQuote.annualizedRateBps)} APR)
                </span>
                <span className="font-mono text-amber-400">
                  -{formatUSDC(activeQuote.totalDiscountUsdc)} (
                  {formatBps(activeQuote.effectiveDiscountBps)})
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>• LP Yield Allocation (90% of Discount)</span>
                <span className="font-mono">
                  {formatUSDC(activeQuote.lpYieldUsdc)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>• Protocol Reserve Fee (10% of Discount)</span>
                <span className="font-mono">
                  {formatUSDC(activeQuote.protocolFeeUsdc)}
                </span>
              </div>
              <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                <span className="font-semibold text-slate-200">
                  Net Instant USDC Payout
                </span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  {formatUSDC(activeQuote.netPayoutUsdc)}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setSelectedInvoice(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmFactor}
                disabled={isSigning}
                className="gap-2"
              >
                <Zap className="h-4 w-4" />
                {isSigning
                  ? "Signing with Freighter..."
                  : "Sign & Receive Instant USDC"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
