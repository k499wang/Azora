export type RewardSpeechKind = 'lesson' | 'mood' | 'reset' | 'breathing';

const LINES: Record<RewardSpeechKind, readonly string[]> = {
  lesson: [
    'Ooh, I learned something too!',
    'That one’s going in my notes!',
    'Smart move. I’m proud of you!',
  ],
  mood: [
    'Thanks for telling me how you feel.',
    'I’m always glad to hear from you.',
    'Checking in is a big deal!',
  ],
  reset: [
    'Ahh, that felt good!',
    'My mind feels lighter too!',
    'Thanks for doing that with me.',
  ],
  breathing: [
    'Ahh, I feel calmer already.',
    'Nice and slow. I loved that.',
    'My whole body says thank you!',
  ],
};

/** One thing Azo says after an activity; a different one now and then, as a friend would. */
export function pickRewardSpeech(kind: RewardSpeechKind): string {
  const lines = LINES[kind];
  return lines[Math.floor(Math.random() * lines.length)];
}
