import type { Business } from "./types";

/**
 * Estimated spend per visit — the midpoint of the business's own listed price
 * range. It is an estimate, and the UI always says so; it is never presented as
 * a transaction record.
 */
export function estimateSpend(b: Pick<Business, "priceRange">): number {
  const nums = (b.priceRange.match(/\d+/g) ?? []).map(Number);
  if (nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];
  return Math.round((nums[0] + nums[1]) / 2);
}

export function formatRM(amount: number): string {
  return `RM${amount.toLocaleString("en-MY")}`;
}