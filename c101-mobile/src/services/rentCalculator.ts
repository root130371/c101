export type RentCalculationInput = {
  cpiRate: number;
  currentRent: number;
  renewalDate: string;
  requestedRent: number;
};

export type RentCalculationResult = {
  aboveCeiling: boolean;
  ceiling: number;
  difference: number;
  increaseAmount: number;
  increasePercent: number;
};

export function calculateRentIncrease(input: RentCalculationInput): RentCalculationResult {
  const currentRent = safeNumber(input.currentRent);
  const requestedRent = safeNumber(input.requestedRent);
  const cpiRate = safeNumber(input.cpiRate);
  const ceiling = Math.round(currentRent * (1 + cpiRate / 100));
  const difference = requestedRent - ceiling;
  const increaseAmount = requestedRent - currentRent;
  const increasePercent = currentRent > 0 ? (increaseAmount / currentRent) * 100 : 0;

  return {
    aboveCeiling: requestedRent > ceiling,
    ceiling,
    difference,
    increaseAmount,
    increasePercent,
  };
}

export function safeNumber(value: number | string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatLira(value: number) {
  return `${Math.round(safeNumber(value)).toLocaleString("tr-TR")} TL`;
}

export function formatPercent(value: number) {
  return `${safeNumber(value).toFixed(1)}%`;
}
