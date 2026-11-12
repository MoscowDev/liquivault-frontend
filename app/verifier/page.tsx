"use client";
import { useRef, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { createSDK, type RiskTier } from "@/lib/sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function VerifierPage() {
  const { verifyInvoice, isConnected, isSigning } = useWallet();
  const [id, setId] = useState("");
  const [tier, setTier] = useState<RiskTier>("Tier B");
  const [record, setRecord] = useState("");
  const [error, setError] = useState("");
  const generation = useRef(0);
  return (
    <section className="max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">Invoice verifier</h1>
      <p>
        Only the configured verifier or registry admin can approve. The contract
        enforces this role. A document hash proves a commitment, not the
        authenticity, uniqueness or legal ownership of an invoice.
      </p>
      <p className="text-amber-300">
        Use synthetic documents on testnet. Independently review debtor,
        currency, amount, maturity, document commitment and potential duplicates
        before approving.
      </p>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setRecord("");
          const request = ++generation.current;
          try {
            if (!/^\d+$/.test(id))
              throw new Error("Enter an unsigned invoice ID");
            const invoice = await createSDK().invoiceRegistry.getInvoice(
              BigInt(id),
            );
            if (request !== generation.current) return;
            setRecord(
              JSON.stringify(
                invoice,
                (_, value) =>
                  typeof value === "bigint" ? value.toString() : value,
                2,
              ),
            );
          } catch (e) {
            if (request === generation.current) setError(String(e));
          }
        }}
      >
        <label htmlFor="verify-id">Invoice ID</label>
        <Input
          id="verify-id"
          value={id}
          onChange={(event) => {
            generation.current++;
            setId(event.target.value);
            setRecord("");
            setError("");
          }}
          required
          inputMode="numeric"
        />
        <Button type="submit">Inspect invoice</Button>
      </form>
      {record && (
        <>
          <pre className="overflow-auto rounded border border-slate-700 p-4 text-xs">
            {record}
          </pre>
          <label htmlFor="verify-risk">Approved risk tier</label>
          <select
            id="verify-risk"
            className="bg-slate-900 p-2"
            value={tier}
            onChange={(event) => setTier(event.target.value as RiskTier)}
          >
            {["Tier A", "Tier B", "Tier C"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <Button
            disabled={!isConnected || isSigning}
            onClick={async () => {
              try {
                setError("");
                await verifyInvoice(BigInt(id), tier);
                setRecord("");
              } catch (e) {
                setError(String(e));
              }
            }}
          >
            Approve inspected invoice
          </Button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
