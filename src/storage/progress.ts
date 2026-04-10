import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@azora/progress/v1';

export type SessionType = 'dailyHold' | 'guidedExercise';

export interface SessionRecord {
  id: string;
  type: SessionType;
  completedAt: string;
  holdSeconds?: number;
  techniqueId?: string;
  rounds?: number;
  elapsedSeconds?: number;
}

interface StoredProgress {
  sessions: SessionRecord[];
}

export interface DailyStats {
  bestHoldSeconds: number;
  totalPracticeSeconds: number;
  sessionCount: number;
}

export interface WeeklyDataPoint {
  label: string;
  value: number;
}

export interface ProgressSummary {
  streakCount: number;
  bestHoldSeconds: number;
  selectedDayStats: DailyStats;
  weeklyHoldTrend: WeeklyDataPoint[];
}

const EMPTY_PROGRESS: StoredProgress = {
  sessions: [],
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function createSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDayKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getPracticeSeconds(session: SessionRecord) {
  if (session.type === 'dailyHold') {
    return session.holdSeconds ?? 0;
  }

  return session.elapsedSeconds ?? 0;
}

function getSessionsForDay(sessions: SessionRecord[], dayKey: string) {
  return sessions.filter((session) => {
    const completedAt = parseDate(session.completedAt);
    return completedAt ? getDayKey(completedAt) === dayKey : false;
  });
}

function deriveDailyStats(sessions: SessionRecord[]): DailyStats {
  const bestHoldSeconds = sessions.reduce(
    (best, session) =>
      session.type === 'dailyHold' ? Math.max(best, session.holdSeconds ?? 0) : best,
    0,
  );

  const totalPracticeSeconds = sessions.reduce(
    (total, session) => total + getPracticeSeconds(session),
    0,
  );

  return {
    bestHoldSeconds,
    totalPracticeSeconds,
    sessionCount: sessions.length,
  };
}

function deriveWeeklyHoldTrend(sessions: SessionRecord[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const dayKey = getDayKey(date);
    const dailyBest = getSessionsForDay(sessions, dayKey).reduce(
      (best, session) =>
        session.type === 'dailyHold' ? Math.max(best, session.holdSeconds ?? 0) : best,
      0,
    );

    return {
      label: DAY_LABELS[date.getDay()],
      value: dailyBest,
    };
  });
}

function deriveStreakCount(sessions: SessionRecord[]) {
  if (sessions.length === 0) return 0;

  const sessionDays = new Set(
    sessions
      .map((session) => parseDate(session.completedAt))
      .filter((date): date is Date => Boolean(date))
      .map((date) => getDayKey(date)),
  );

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  let streak = 0;
  while (sessionDays.has(getDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function loadProgress(): Promise<StoredProgress> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;

    const parsed = JSON.parse(raw) as StoredProgress | null;
    if (!parsed || !Array.isArray(parsed.sessions)) {
      return EMPTY_PROGRESS;
    }

    return {
      sessions: parsed.sessions.filter(
        (session): session is SessionRecord =>
          Boolean(session) &&
          typeof session.id === 'string' &&
          typeof session.type === 'string' &&
          typeof session.completedAt === 'string',
      ),
    };
  } catch {
    return EMPTY_PROGRESS;
  }
}

async function saveProgress(progress: StoredProgress) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export async function recordDailyHoldSession(holdSeconds: number, completedAt = new Date()) {
  if (holdSeconds <= 0) return;

  const progress = await loadProgress();
  progress.sessions.push({
    id: createSessionId(),
    type: 'dailyHold',
    completedAt: completedAt.toISOString(),
    holdSeconds,
  });
  await saveProgress(progress);
}

export async function recordGuidedExerciseSession(input: {
  techniqueId: string;
  rounds: number;
  elapsedSeconds: number;
  completedAt?: Date;
}) {
  if (input.elapsedSeconds <= 0) return;

  const progress = await loadProgress();
  progress.sessions.push({
    id: createSessionId(),
    type: 'guidedExercise',
    completedAt: (input.completedAt ?? new Date()).toISOString(),
    techniqueId: input.techniqueId,
    rounds: input.rounds,
    elapsedSeconds: input.elapsedSeconds,
  });
  await saveProgress(progress);
}

export async function getTodayBestHoldSeconds() {
  const progress = await loadProgress();
  const todaySessions = getSessionsForDay(progress.sessions, getDayKey(new Date()));
  return deriveDailyStats(todaySessions).bestHoldSeconds;
}

export function deriveProgressSummary(
  progress: StoredProgress,
  selectedDate = new Date(),
): ProgressSummary {
  const selectedDayKey = getDayKey(selectedDate);
  const selectedDaySessions = getSessionsForDay(progress.sessions, selectedDayKey);
  const bestHoldSeconds = progress.sessions.reduce(
    (best, session) =>
      session.type === 'dailyHold' ? Math.max(best, session.holdSeconds ?? 0) : best,
    0,
  );

  return {
    streakCount: deriveStreakCount(progress.sessions),
    bestHoldSeconds,
    selectedDayStats: deriveDailyStats(selectedDaySessions),
    weeklyHoldTrend: deriveWeeklyHoldTrend(progress.sessions),
  };
}
