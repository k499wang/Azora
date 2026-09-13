/**
 * The user's own words, handed back ready to sit inside one of the app's
 * sentences.
 *
 * The rules this file exists to enforce, because they are what keep an echo
 * from turning into a parlour trick:
 *
 * - An echo is a premise, never an announcement. Callers write "Kept short,
 *   since you're too tired", not "You said you're too tired".
 * - The fragment is authored next to the option, not derived from its title.
 *   Titles are first-person sentences — "I'm too tired", "It all feels like too
 *   much" — and no general transform turns those into second person without
 *   mangling one of them. An option with no `echo` is simply never quoted.
 * - Nothing is echoed that the user did not actually choose. A default slider,
 *   a skipped step and a multi-select with more than one pick all return null,
 *   and the caller falls back to copy that claims nothing.
 */

export interface EchoableOption<Id extends string> {
  id: Id;
  /** The answer said inside a sentence. Absent means this one is not quoted. */
  echo?: string;
}

/**
 * The single chosen option's fragment, or null.
 *
 * More than one pick returns null on purpose: naming one of three would read as
 * having ignored the other two, which is the opposite of what an echo is for.
 */
export function echoOption<Id extends string>(
  options: readonly EchoableOption<Id>[],
  selected: readonly Id[],
): string | null {
  if (selected.length !== 1) return null;
  return options.find((option) => option.id === selected[0])?.echo ?? null;
}

/** The same, for a single-value answer that may never have been given. */
export function echoSingle<Id extends string>(
  options: readonly EchoableOption<Id>[],
  selected: Id | null | undefined,
): string | null {
  if (selected == null) return null;
  return echoOption(options, [selected]);
}
