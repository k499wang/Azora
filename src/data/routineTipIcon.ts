import type { IconName } from '../components/common/icons/Icon';

/** What the tip asks someone to have ready wins over when or where it happens. */
const TIP_ICONS: readonly [RegExp, IconName][] = [
  [/\b(phone|notifications?)\b/, 'todo-screen-free'],
  [/\b(glass|mug|drink)\b/, 'todo-water'],
  [/\b(lunch|breakfast|food|eat)\b/, 'todo-meal'],
  [/\b(towel)\b/, 'todo-towel'],
  [/\b(laundry|load|care labels?|drying|dryer|wash)\b/, 'todo-washer'],
  [/\b(clothes|sleepwear|shoes)\b/, 'todo-fold'],
  [/\b(toiletries)\b/, 'todo-sink'],
  [/\b(book|bookmark|reading|files|notes)\b/, 'book'],
  [/\b(vacuum|mop|cloths?|cleaner|cleaning|products?|dish supplies|stovetop)\b/, 'todo-broom'],
  [/\b(bags?|baskets?|keys)\b/, 'todo-pack'],
  [/\b(timer|minutes|end time|finish point|stopping point|ends|how long)\b/, 'todo-focus-timer'],
  [/\b(calendar|appointments|plans?|task list|shopping list)\b/, 'todo-plan'],
  [/\b(note|notebook|paper|blank page|jot)\b/, 'todo-worry-note'],
  [/\b(window|outdoor|outside|weather|ventilate)\b/, 'todo-fresh-air'],
  [/\b(surfaces?|counter|floor|walkways|room|space)\b/, 'todo-surface'],
];

export function routineTipIcon(tip: string): IconName {
  const text = tip.toLowerCase();
  return TIP_ICONS.find(([pattern]) => pattern.test(text))?.[1] ?? 'todo-priorities';
}
