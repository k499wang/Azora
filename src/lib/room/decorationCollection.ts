export interface CollectionEntry {
  day: string;
  optionId: string;
  name: string;
}

export type CollectionTile<Entry extends CollectionEntry = CollectionEntry> =
  | { kind: 'owned'; key: string; entry: Entry }
  | { kind: 'locked'; key: string };

export interface DecorationCollection<Entry extends CollectionEntry = CollectionEntry> {
  ownedCount: number;
  total: number;
  tiles: CollectionTile<Entry>[];
}

export function buildDecorationCollection<Entry extends CollectionEntry>(
  catalog: readonly Entry[],
  owned: readonly { optionId: string; acquiredLocalDate: string | null }[],
  tileCount: number,
): DecorationCollection<Entry> {
  const acquiredOn = new Map<string, string>();
  for (const object of owned) {
    const previous = acquiredOn.get(object.optionId);
    const date = object.acquiredLocalDate ?? '';
    if (previous == null || date > previous) acquiredOn.set(object.optionId, date);
  }

  const ownedEntries = catalog
    .filter((entry) => acquiredOn.has(entry.optionId))
    .sort((a, b) => (acquiredOn.get(b.optionId) ?? '').localeCompare(acquiredOn.get(a.optionId) ?? ''));
  const lockedEntries = catalog.filter((entry) => !acquiredOn.has(entry.optionId));

  const tiles: CollectionTile<Entry>[] = [
    ...ownedEntries.map((entry) => ({
      kind: 'owned' as const,
      key: `${entry.day}.${entry.optionId}`,
      entry,
    })),
    ...lockedEntries.map((entry) => ({
      kind: 'locked' as const,
      key: `${entry.day}.${entry.optionId}`,
    })),
  ].slice(0, tileCount);

  return { ownedCount: ownedEntries.length, total: catalog.length, tiles };
}
