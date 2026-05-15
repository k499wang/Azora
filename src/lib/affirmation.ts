export interface AffirmationContext {
  firstName?: string | null;
  hour: number;
  durationSec: number;
}

type Slot = 'morning' | 'midday' | 'evening' | 'night';

function slotForHour(hour: number): Slot {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'midday';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

const POOL: Record<Slot, { withName: (n: string) => string; noName: string }[]> = {
  morning: [
    { withName: (n) => `Strong start, ${n}.`, noName: 'Strong start.' },
    { withName: (n) => `Beautiful morning work, ${n}.`, noName: 'Beautiful morning work.' },
    { withName: (n) => `${n}, you brought peace to your morning.`, noName: 'A peaceful start to the day.' },
  ],
  midday: [
    { withName: (n) => `A bright pause, ${n}.`, noName: 'A bright pause in your day.' },
    { withName: (n) => `${n}, you made room for calm today.`, noName: 'You made room for calm today.' },
    { withName: (n) => `Good for you, ${n}.`, noName: 'Good for you.' },
  ],
  evening: [
    { withName: (n) => `Soft evening, well done ${n}.`, noName: 'A soft evening, well done.' },
    { withName: (n) => `${n}, you closed the day with care.`, noName: 'You closed the day with care.' },
    { withName: (n) => `Lovely work, ${n}.`, noName: 'Lovely work today.' },
  ],
  night: [
    { withName: (n) => `${n}, you ended the day kind to yourself.`, noName: 'You ended the day kind to yourself.' },
    { withName: (n) => `Rest well, ${n}.`, noName: 'Rest well tonight.' },
  ],
};

const LONG_SESSION_BONUS = (n: string | null) =>
  n ? `That was real time, ${n}.` : 'That was real time you gave yourself.';

export function buildAffirmation(ctx: AffirmationContext): string {
  const name = ctx.firstName?.trim() || null;
  const slot = slotForHour(ctx.hour);

  if (ctx.durationSec >= 480) {
    return LONG_SESSION_BONUS(name);
  }

  const pool = POOL[slot];
  const seed = Math.floor(ctx.hour + ctx.durationSec) % pool.length;
  const pick = pool[seed];
  return name ? pick.withName(name) : pick.noName;
}
