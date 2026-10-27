import type { CleanupItem } from './cleanupPlan';

export const MAX_EDITED_MINUTES = 60;
export const MAX_ITEMS = 20;
const MAX_NAME_LENGTH = 120;

/** A typed name, trimmed and short enough for the step screen; null when there is nothing to save. */
export function cleanItemName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  return trimmed.length === 0 ? null : trimmed.slice(0, MAX_NAME_LENGTH);
}

export function clampItemMinutes(minutes: number): number {
  return Math.min(MAX_EDITED_MINUTES, Math.max(1, Math.round(minutes)));
}

export function replaceItem(items: readonly CleanupItem[], index: number, item: CleanupItem): CleanupItem[] {
  return items.map((current, at) => (at === index ? item : current));
}

export function removeItem(items: readonly CleanupItem[], index: number): CleanupItem[] {
  return items.filter((_, at) => at !== index);
}

export function moveItem(items: readonly CleanupItem[], index: number, direction: -1 | 1): CleanupItem[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return [...items];
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function addItem(items: readonly CleanupItem[], item: CleanupItem): CleanupItem[] {
  return items.length >= MAX_ITEMS ? [...items] : [...items, item];
}
