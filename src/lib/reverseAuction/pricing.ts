export function computeReverseAuctionPrice(params: {
  startingPrice: number;
  floorPrice: number;
  dropAmount: number;
  dropIntervalMinutes: number;
  startsAt: string;
  now?: Date;
}): number {
  const { startingPrice, floorPrice, dropAmount, dropIntervalMinutes, startsAt } = params;
  const now = params.now ?? new Date();
  const start = new Date(startsAt);
  if (now <= start) return startingPrice;
  const elapsedMinutes = (now.getTime() - start.getTime()) / 60000;
  const intervals = Math.floor(elapsedMinutes / dropIntervalMinutes);
  const price = startingPrice - intervals * dropAmount;
  return Math.max(floorPrice, price);
}

export function nextPriceDropAt(params: {
  dropIntervalMinutes: number;
  startsAt: string;
  now?: Date;
}): Date {
  const { dropIntervalMinutes, startsAt } = params;
  const now = params.now ?? new Date();
  const start = new Date(startsAt);
  if (now <= start) return start;
  const elapsedMinutes = (now.getTime() - start.getTime()) / 60000;
  const intervals = Math.floor(elapsedMinutes / dropIntervalMinutes) + 1;
  return new Date(start.getTime() + intervals * dropIntervalMinutes * 60000);
}