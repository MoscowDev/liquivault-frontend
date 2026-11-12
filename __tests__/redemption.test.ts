import { describe, it, expect } from "vitest";
import { redemptionEligibility, type RedemptionInput } from "@/lib/redemption";
const base: RedemptionInput = {
  shares: 10n,
  positionShares: 100n,
  trancheAssets: 100n,
  trancheShares: 100n,
  totalAssets: 1000n,
  deployed: 0n,
  lastDepositTimestamp: 100,
  now: 86500,
  paused: false,
  junior: false,
};
describe("contract-derived redemption", () => {
  it("unlocks exactly at last deposit plus 86400 seconds", () => {
    expect(redemptionEligibility({ ...base, now: 86499 }).allowed).toBe(false);
    expect(redemptionEligibility(base).allowed).toBe(true);
    expect(
      redemptionEligibility({ ...base, lastDepositTimestamp: 101 }).allowed,
    ).toBe(false);
  });
  it("blocks absent shares, paused pools and empty redemption", () => {
    for (const change of [
      { shares: 0n },
      { shares: 101n },
      { paused: true },
      { trancheAssets: 0n },
    ])
      expect(redemptionEligibility({ ...base, ...change }).allowed).toBe(false);
  });
  it("floors token units and distinguishes idle liquidity from coverage", () => {
    expect(
      redemptionEligibility({ ...base, shares: 3n, trancheAssets: 101n })
        .assets,
    ).toBe(3n);
    expect(redemptionEligibility({ ...base, deployed: 995n }).reason).toMatch(
      /idle/,
    );
    expect(
      redemptionEligibility({ ...base, junior: true, deployed: 900n }).allowed,
    ).toBe(true);
    expect(
      redemptionEligibility({ ...base, junior: true, deployed: 901n }).reason,
    ).toMatch(/10%/);
    // A one-unit remainder matters: comparing rounded token displays would accept this.
    expect(
      redemptionEligibility({
        ...base,
        junior: true,
        deployed: 901n,
        shares: 9n,
      }).allowed,
    ).toBe(true);
  });
});
