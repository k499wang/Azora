/**
 * The zigzag a week's days are laid along, and what a tapped node says.
 *
 * Pure so the shape can be tested without drawing it: the path swings out to
 * two steps either side of centre and back, a full swing every eight nodes.
 */

const SWING = [0, 1, 2, 1, 0, -1, -2, -1] as const;

/** How many steps off centre the node at `index` within its week sits, -2..2. */
export function pathNodeOffset(index: number): number {
  const at = ((Math.trunc(index) % SWING.length) + SWING.length) % SWING.length;
  return SWING[at];
}

export type PathDetailRowKind = 'exercise' | 'checkIn' | 'lesson';

export interface PathDetailRow {
  kind: PathDetailRowKind;
  label: string;
  /** Only exercises carry an authored length; nothing else is guessed at. */
  minutes: number | null;
}

export interface PathDetail {
  title: string;
  /** The one thing the day is for. */
  focus: string | null;
  rows: readonly PathDetailRow[];
  /** The rows are a record of what was done rather than a plan. */
  rowsDone: boolean;
}

export interface PathDayExercise {
  title: string;
  estimatedSeconds: number;
}

function exerciseMinutes(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

function dayRows(exercises: readonly PathDayExercise[]): PathDetailRow[] {
  return [
    ...exercises.map((exercise) => ({
      kind: 'exercise' as const,
      label: exercise.title,
      minutes: exerciseMinutes(exercise.estimatedSeconds),
    })),
    { kind: 'checkIn', label: 'Check-in', minutes: null },
    { kind: 'lesson', label: 'Lesson', minutes: null },
  ];
}

/**
 * What a tapped day says: what it asks for and how long the exercises take.
 * Today and days behind name their lesson and its one action; days ahead never
 * do — the bubble over today is the only preview, and a path of spoilers is a
 * list to read. A day ahead gets the week's purpose instead.
 */
export function pathDayDetail({
  day,
  state,
  exercises,
  lesson,
  weekPurpose,
  opensTomorrow = false,
}: {
  day: number;
  state: 'done' | 'doneToday' | 'today' | 'ahead';
  exercises: readonly PathDayExercise[];
  /** `step` is the lesson's one action, a single authored sentence. */
  lesson: { title: string; step: string } | null;
  weekPurpose: string | null;
  /** The day after one finished today: it opens when the calendar turns. */
  opensTomorrow?: boolean;
}): PathDetail {
  const rows = dayRows(exercises);

  if (state === 'ahead') {
    return {
      title: opensTomorrow ? 'Unlocks tomorrow' : `Unlocks after day ${day - 1}`,
      focus: weekPurpose,
      rows,
      rowsDone: false,
    };
  }

  return {
    title: lesson?.title ?? `Day ${day}`,
    focus: lesson?.step ?? null,
    rows,
    rowsDone: state !== 'today',
  };
}

export function pathRoomDetail(week: number, done: boolean): PathDetail {
  return {
    title: done ? 'Every day this week is done' : `Finish week ${week} to fill a new room`,
    focus: done ? null : 'Each day you finish adds something to it',
    rows: [],
    rowsDone: false,
  };
}
