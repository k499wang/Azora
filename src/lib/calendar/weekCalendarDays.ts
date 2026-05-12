const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_MS = 24 * 60 * 60 * 1000;

export interface WeekCalendarDay {
  key: string;
  localDate: string;
  dayLabel: string;
  dateNum: number;
  isToday: boolean;
  isFuture: boolean;
  isCompleted: boolean;
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseLocalDate(localDate: string): Date {
  const [year, month, day] = localDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function buildWeekCalendarDays(
  todayLocalDate: string,
  completedDaysAgo: number[],
  totalDays: number,
  todayIndex = totalDays - 1,
): WeekCalendarDay[] {
  const today = parseLocalDate(todayLocalDate);
  const completedSet = new Set(completedDaysAgo);

  return Array.from({ length: totalDays }, (_, i) => {
    const offset = i - todayIndex;
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const localDate = formatLocalDate(date);

    return {
      key: localDate,
      localDate,
      dayLabel: DAY_LABELS[date.getDay()],
      dateNum: date.getDate(),
      isToday: offset === 0,
      isFuture: offset > 0,
      isCompleted: offset <= 0 && completedSet.has(-offset),
    };
  });
}

export function getCompletedDaysAgoFromActivityDates(
  rows: Array<{ activityDate: string; qualifiesForStreak: boolean }>,
  today = new Date(),
  limitDays = 28,
): number[] {
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return rows
    .filter((row) => row.qualifiesForStreak)
    .map((row) => {
      const date = parseLocalDate(row.activityDate);
      return Math.round((todayDate.getTime() - date.getTime()) / DAY_MS);
    })
    .filter((daysAgo) => daysAgo >= 0 && daysAgo < limitDays);
}
