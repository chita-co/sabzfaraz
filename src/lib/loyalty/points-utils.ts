// src/lib/loyalty/points-utils.ts
export function calculatePointsToEarn(amount: number, tomanPerPoint: number, multiplier = 1): number {
  if (tomanPerPoint <= 0) return 0;
  return Math.floor((amount / tomanPerPoint) * multiplier);
}