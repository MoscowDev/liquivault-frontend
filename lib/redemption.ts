export interface RedemptionInput {
  shares: bigint;
  positionShares: bigint;
  trancheAssets: bigint;
  trancheShares: bigint;
  totalAssets: bigint;
  deployed: bigint;
  lastDepositTimestamp: number;
  now: number;
  paused: boolean;
  junior: boolean;
}

/** Snapshot only. Execution rechecks ledger time, liquidity and authorization. */
export function redemptionEligibility(input: RedemptionInput) {
  const unlockTimestamp = input.lastDepositTimestamp + 86400;
  const assets =
    input.trancheShares > 0n
      ? (input.shares * input.trancheAssets) / input.trancheShares
      : 0n;
  let reason: string | null = null;
  if (input.paused) reason = "Pool is paused";
  else if (input.shares <= 0n) reason = "Enter a positive share amount";
  else if (input.shares > input.positionShares)
    reason = "Exceeds your share balance";
  else if (input.now < unlockTimestamp)
    reason = `Position locked until ${new Date(unlockTimestamp * 1000).toISOString()}`;
  else if (assets <= 0n) reason = "Shares redeem to zero token units";
  else if (assets > input.totalAssets - input.deployed)
    reason = "Insufficient idle pool liquidity";
  else if (
    input.junior &&
    (input.trancheAssets - assets) * 10000n < input.deployed * 1000n
  )
    reason =
      "Withdrawal would leave junior capital below 10% of deployed capital";
  return { allowed: reason === null, reason, assets, unlockTimestamp };
}
