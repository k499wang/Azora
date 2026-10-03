export const COIN_CURRENCY = 'coin';

export const EARN_RATES = {
  dailiesComplete: 25,
  extraSession: 5,
  extraSessionsPerDay: 2,
} as const;

export const PRICES = {
  objectTiers: [30, 60, 100],
  roomShell: 60,
  floor: 250,
} as const;

export interface WalletEntry {
  id: string;
  currency: string;
  delta: number;
  reason: string;
  localDate: string;
  createdAt: string;
}

/** Affordability is a preview; purchase transactions must check again. */
export function canAfford(balance: number, price: number): boolean {
  return (
    Number.isSafeInteger(balance) &&
    balance >= 0 &&
    Number.isSafeInteger(price) &&
    price >= 0 &&
    balance >= price
  );
}
