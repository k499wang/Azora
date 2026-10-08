import { APP_STORE_URL } from '../../lib/appStoreLink';

export type ActivityResultKind = 'lesson' | 'mood' | 'reset' | 'breathing';

const SUBTITLES: Record<ActivityResultKind, string> = {
  lesson: 'One new insight. One step toward days that feel easier.',
  mood: 'You made space for yourself. That’s how better days begin.',
  reset: 'A little reset. More room for what matters today.',
  breathing: 'A moment for yourself. Another small win toward a life that feels better.',
};

const SHARE_LINES: Record<ActivityResultKind, string> = {
  lesson: 'Today’s small win: learning something new about myself.',
  mood: 'Today’s small win: making time to check in with myself.',
  reset: 'Today’s small win: taking a moment to reset and make room for what matters.',
  breathing: 'Today’s small win: taking a few minutes for myself.',
};

export function getActivityResultCopy(kind: ActivityResultKind) {
  return {
    title: 'Small win. Real progress.',
    subtitle: SUBTITLES[kind],
    shareMessage: `${SHARE_LINES[kind]} I’m building better days with Azora.\n\nLess overwhelm. More small wins. Join me on Azora:\n${APP_STORE_URL}`,
  };
}
