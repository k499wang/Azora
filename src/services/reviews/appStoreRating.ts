import { APP_STORE_ID } from '../../lib/appStoreLink';

const LOOKUP_URL = `https://itunes.apple.com/lookup?id=${APP_STORE_ID}&country=us`;

/** The listing's average as the App Store rounds it ("4.9"), or null when Apple has none. */
export function formatAppStoreRating(lookup: unknown): string | null {
  const average = (lookup as { results?: { averageUserRating?: unknown }[] } | null)
    ?.results?.[0]?.averageUserRating;
  return typeof average === 'number' && average > 0 ? average.toFixed(1) : null;
}

export async function fetchAppStoreRating(): Promise<string | null> {
  const response = await fetch(LOOKUP_URL);
  if (!response.ok) throw new Error(`App Store lookup failed: ${response.status}`);
  return formatAppStoreRating(await response.json());
}
