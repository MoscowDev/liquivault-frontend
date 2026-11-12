"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { toUnits, fromUnits } from "@/lib/sdk";
import { redemptionEligibility } from "@/lib/redemption";

export function useRedemption(shares: number, junior: boolean) {
  const wallet = useWallet();
  const [now, setNow] = useState(0);
  useEffect(() => {
    const update = () => setNow(Math.floor(Date.now() / 1000));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  const snapshot = wallet.redemptionSnapshot;
  if (!wallet.isConnected || !snapshot || !now)
    return {
      allowed: false,
      reason: "Connect your wallet and wait for a position snapshot",
      assets: 0n,
    };
  let units = 0n;
  try {
    units = toUnits(shares);
  } catch {
    /* Invalid input stays blocked. */
  }
  return redemptionEligibility({
    shares: units,
    positionShares: junior ? snapshot.juniorPosition : snapshot.seniorPosition,
    trancheAssets: junior ? snapshot.juniorAssets : snapshot.seniorAssets,
    trancheShares: junior ? snapshot.juniorShares : snapshot.seniorShares,
    totalAssets: snapshot.seniorAssets + snapshot.juniorAssets,
    deployed: snapshot.deployed,
    lastDepositTimestamp: junior
      ? wallet.juniorLastDepositTimestamp
      : wallet.seniorLastDepositTimestamp,
    now,
    paused: snapshot.paused,
    junior,
  });
}

export function RedemptionStatus({
  check,
}: {
  check: ReturnType<typeof useRedemption>;
}) {
  return (
    <div role="status" className="text-xs text-amber-300 space-y-1">
      <p>
        {check.allowed
          ? `Snapshot estimate: ${fromUnits(check.assets)} LVTEST`
          : check.reason}
      </p>
      <p>
        Each top-up locks the entire tranche position for 24 hours. The contract
        rechecks eligibility when executed; this snapshot does not guarantee
        withdrawal.
      </p>
    </div>
  );
}
