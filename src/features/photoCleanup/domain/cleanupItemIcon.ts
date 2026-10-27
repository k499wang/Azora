/**
 * The to-do illustration for a cleanup item, read from its label. What the
 * thing is wins over where it sits, so "Mugs on the desk" shows dishes.
 */
const ITEM_ICONS: readonly [RegExp, string][] = [
  [/\b(shoes?|sneakers?|boots?|sandals?|slippers?)\b/, 'todo-shoes'],
  [/\b(clothes|clothing|shirts?|t-shirts?|jackets?|hoodies?|sweaters?|socks?|pants|jeans|laundry|coats?)\b/, 'todo-hamper'],
  [/\b(towels?)\b/, 'todo-towel'],
  [/\b(mugs?|cups?|plates?|dishes|bowls?|glasses|cutlery|forks?|spoons?|pans?|pots?)\b/, 'todo-dishes'],
  [/\b(food|snacks?|leftovers?)\b/, 'todo-fridge'],
  [/\b(trash|rubbish|garbage|wrappers?|packaging|cans?|bottles?|receipts?|tissues?)\b/, 'todo-tidy'],
  [/\b(papers?|mail|letters?|books?|notebooks?|magazines?|documents?)\b/, 'todo-mail'],
  [/\b(pillows?|blankets?|sheets?|duvet|bedding)\b/, 'todo-bed'],
  [/\b(cables?|chargers?|cords?|electronics|toys?|boxes|bags?)\b/, 'todo-storage'],
  [/\b(sink)\b/, 'todo-sink'],
  [/\b(mirror)\b/, 'todo-mirror'],
  [/\b(toilet)\b/, 'todo-toilet'],
  [/\b(bed)\b/, 'todo-bed'],
  [/\b(desk|table|counter|surface|shelf|shelves|nightstand|dresser)\b/, 'todo-surface'],
];

export function cleanupItemIcon(name: string): string {
  const label = name.toLowerCase();
  return ITEM_ICONS.find(([pattern]) => pattern.test(label))?.[1] ?? 'todo-broom';
}
