/**
 * Dev only: the next lesson or check-in finish celebrates the day as if it
 * were the last thing left, so the moment can be watched again without
 * clearing a real day.
 *
 * `__DEV__` is checked at the write and at the read, so a release build can
 * neither arm it nor spend it.
 */
let forced = false;

export function forceNextDayComplete(): void {
  if (!__DEV__) return;

  forced = true;
}

/** Spends the forced finish, if one is waiting. */
export function takeForcedDayComplete(): boolean {
  if (!__DEV__ || !forced) return false;

  forced = false;
  return true;
}
