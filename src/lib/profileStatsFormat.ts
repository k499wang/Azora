export function formatProfileDuration(totalSeconds: number): string {
  return `${formatProfileCount(Math.floor(totalSeconds / 60))}m`;
}

export function formatProfileCount(value: number): string {
  return value.toLocaleString('en-US');
}
