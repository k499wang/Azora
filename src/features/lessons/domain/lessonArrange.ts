/**
 * The order an arrange activity's chips sit in the bank.
 *
 * Shuffled from the steps' own text, so a lesson always deals the same bank and
 * a re-read is the same puzzle. A shuffle that happens to land in order is
 * turned once, because a bank already in order is no puzzle at all.
 */
export function arrangeBankOrder(steps: readonly string[]): number[] {
  const order = steps.map((_, index) => index);
  let seed = 0;
  for (const step of steps) {
    for (let i = 0; i < step.length; i += 1) seed = (Math.imul(seed, 31) + step.charCodeAt(i)) >>> 0;
  }
  for (let i = order.length - 1; i > 0; i -= 1) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.length > 1 && order.every((step, index) => step === index)) order.push(order.shift()!);
  return order;
}
