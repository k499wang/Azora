import { requireSupabaseClient } from '../supabase';
import { balanceOf, type WalletEntry } from '../../lib/wallet/coins';

const ENTRY_COLUMNS = 'id, currency, delta, reason, local_date, created_at';

interface WalletEntryRow {
  id: string;
  currency: string;
  delta: number;
  reason: string;
  local_date: string;
  created_at: string;
}

function mapEntry(row: WalletEntryRow): WalletEntry {
  return {
    id: row.id,
    currency: row.currency,
    delta: row.delta,
    reason: row.reason,
    localDate: row.local_date,
    createdAt: row.created_at,
  };
}

export async function getWalletEntries(userId: string): Promise<WalletEntry[]> {
  const { data, error } = await requireSupabaseClient()
    .from('wallet_entries')
    .select(ENTRY_COLUMNS)
    .eq('user_id', userId)
    .eq('currency', 'coin')
    .order('created_at', { ascending: false });
  if (error != null) throw error;
  return (data ?? []).map(mapEntry);
}

interface AddEntryInput {
  amount: number;
  reason: string;
  localDate: string;
}

export async function grantCoins(
  userId: string,
  input: AddEntryInput,
): Promise<WalletEntry> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error('Coin grant must be a positive whole number.');
  }
  return addEntry(userId, input.amount, input.reason, input.localDate);
}

export async function spendCoins(
  userId: string,
  input: AddEntryInput,
): Promise<WalletEntry> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new Error('Coin price must be a positive whole number.');
  }
  const entries = await getWalletEntries(userId);
  if (balanceOf(entries) < input.amount) {
    throw new Error('Not enough coins.');
  }
  return addEntry(userId, -input.amount, input.reason, input.localDate);
}

async function addEntry(
  userId: string,
  delta: number,
  reason: string,
  localDate: string,
): Promise<WalletEntry> {
  const { data, error } = await requireSupabaseClient()
    .from('wallet_entries')
    .insert({ user_id: userId, currency: 'coin', delta, reason, local_date: localDate })
    .select(ENTRY_COLUMNS)
    .single();
  if (error != null) throw error;
  return mapEntry(data);
}
