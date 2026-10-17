import { PROGRAM_NAME } from '../../program/domain/programCatalogue';

export interface FutureSelfLetterInput {
  displayName: string | null | undefined;
  /** The plan's Day 1, `YYYY-MM-DD` in the user's calendar. */
  startLocalDate: string;
  tagline?: string;
  planPromise?: string;
  futureName?: string;
  dayCount: number;
}

export interface FutureSelfLetterParagraph {
  text: string;
  emphasis?: boolean;
}

export interface FutureSelfLetter {
  heading: string;
  paragraphs: FutureSelfLetterParagraph[];
  signOff: string;
}

const DAY_COUNT_WORDS: Record<number, string> = {
  21: 'Twenty-one',
  28: 'Twenty-eight',
  30: 'Thirty',
  42: 'Forty-two',
  56: 'Fifty-six',
  84: 'Eighty-four',
};

export function firstNameOf(displayName: string | null | undefined): string | null {
  const first = displayName?.trim().split(/\s+/)[0] ?? '';
  return first.length > 0 ? first : null;
}

export function dayCountInWords(dayCount: number): string {
  return DAY_COUNT_WORDS[dayCount] ?? String(dayCount);
}

function localCalendarDate(localDate: string): Date {
  const [year, month, day] = localDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatLetterStartDate(localDate: string): string {
  return localCalendarDate(localDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatLetterCallingFrom(localDate: string): string {
  const start = localCalendarDate(localDate);
  return new Date(start.getFullYear() + 1, start.getMonth(), 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatLetterDateline(localDate: string): string {
  const start = localCalendarDate(localDate);
  return new Date(start.getFullYear() + 1, start.getMonth(), start.getDate()).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' },
  );
}

export function buildFutureSelfLetter({
  displayName,
  startLocalDate,
  tagline,
  planPromise,
  futureName,
  dayCount,
}: FutureSelfLetterInput): FutureSelfLetter {
  const first = firstNameOf(displayName);
  const paragraphs: FutureSelfLetterParagraph[] = [
    {
      text: `It's me, future ${first ?? 'you'}! I'm calling from ${formatLetterCallingFrom(startLocalDate)} with the best news, so get comfy. Today is a big day for you, and for us.`,
    },
    {
      text: `${formatLetterStartDate(startLocalDate)} is the day we started our ${PROGRAM_NAME}.`,
      emphasis: true,
    },
  ];

  if (tagline != null) {
    paragraphs.push({
      text: `I remember exactly where you are right now. ${tagline.trim()} It's okay. That's just where our story starts.`,
    });
  }

  if (planPromise != null && futureName != null) {
    paragraphs.push({
      text: `And now? I'm ${futureName.trim().replace(/^The /, 'the ')}. ${planPromise.trim().replace(/\.+$/, '')}. That's just our life.`,
    });
  }

  paragraphs.push(
    {
      text: 'Every day was small. A short lesson, a quick Reset, one little habit. Azo cheered for every single one (that koala is very proud of us, by the way). And our little room filled up, one piece at a time.',
    },
    { text: `${dayCountInWords(dayCount)} days of tiny steps. That's all it took.` },
    { text: "So say yes today, okay? I'll be right here, every step of the way." },
  );

  return {
    heading: first != null ? `${first}, do you copy?` : 'Hey, do you copy?',
    paragraphs,
    signOff: `See you soon,\nFuture ${first ?? 'you'}`,
  };
}
