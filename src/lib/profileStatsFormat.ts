export function formatProfileDuration(totalSeconds: number): string {
  return `${formatProfileCount(Math.floor(totalSeconds / 60))}m`;
}

export function formatProfileCount(value: number): string {
  return value.toLocaleString('en-US');
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function localDateParts(localDate: string) {
  const [year, month, day] = localDate.split('-').map(Number);
  return { year, monthName: MONTH_NAMES[month - 1], day };
}

export function formatProfileDate(localDate: string): string {
  const { year, monthName, day } = localDateParts(localDate);
  return `${monthName.slice(0, 3)} ${day}, ${year}`;
}

export function formatProfileMonth(localDate: string): string {
  const { year, monthName } = localDateParts(localDate);
  return `${monthName} ${year}`;
}
