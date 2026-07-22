import { Image, type ImageLoadOptions, type ImageRef } from 'expo-image';
import {
  BREATH_HERO_BACKGROUND_ASSET,
  DAILY_PLAN_BACKGROUND_ASSET,
  HEART_HERO_BACKGROUND_ASSET,
  HOME_HERO_BACKGROUND_ASSET,
  PROFILE_HERO_BACKGROUND_ASSET,
  RESULT_BACKGROUND_ASSET,
  SUNSET_BACKGROUND_ASSET,
} from '../../data/backgroundAssets';

export type BackgroundImageKey =
  | 'result'
  | 'sunset'
  | 'homeHero'
  | 'breathHero'
  | 'heartHero'
  | 'profileHero'
  | 'dailyPlan';

const sources: Record<BackgroundImageKey, number> = {
  result: RESULT_BACKGROUND_ASSET.source,
  sunset: SUNSET_BACKGROUND_ASSET.source,
  homeHero: HOME_HERO_BACKGROUND_ASSET.source,
  breathHero: BREATH_HERO_BACKGROUND_ASSET.source,
  heartHero: HEART_HERO_BACKGROUND_ASSET.source,
  profileHero: PROFILE_HERO_BACKGROUND_ASSET.source,
  dailyPlan: DAILY_PLAN_BACKGROUND_ASSET.source,
};

const loadOptions: Partial<Record<BackgroundImageKey, ImageLoadOptions>> = {
  // The share artifact is 1080px square. Capping the landscape source by
  // height preserves that output while avoiding a full 3037x1620 decode.
  result: { maxHeight: 1080 },
  homeHero: { maxWidth: 1400 },
  breathHero: { maxWidth: 1400 },
  heartHero: { maxWidth: 1400 },
  profileHero: { maxWidth: 1400 },
  dailyPlan: { maxWidth: 1400 },
};

const retainedImages: Partial<Record<BackgroundImageKey, ImageRef>> = {};
const pendingLoads: Partial<Record<BackgroundImageKey, Promise<ImageRef>>> = {};

export function loadBackgroundImage(key: BackgroundImageKey): Promise<ImageRef> {
  const retained = retainedImages[key];
  if (retained != null) return Promise.resolve(retained);

  const pending = pendingLoads[key];
  if (pending != null) return pending;

  const load = Image.loadAsync(sources[key], loadOptions[key])
    .then((image) => {
      retainedImages[key] = image;
      return image;
    })
    .finally(() => {
      delete pendingLoads[key];
    });

  pendingLoads[key] = load;
  return load;
}

export async function loadCriticalBackgroundImages(): Promise<void> {
  const criticalKeys: BackgroundImageKey[] = [
    'sunset',
    'result',
    'homeHero',
    'breathHero',
    'heartHero',
    'profileHero',
    'dailyPlan',
  ];
  const results = await Promise.allSettled(
    criticalKeys.map((key) => loadBackgroundImage(key)),
  );

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const key = criticalKeys[index];
      console.warn(`[images] Failed to predecode ${key} background`, result.reason);
    }
  });
}

export function getBackgroundImageSource(key: BackgroundImageKey): ImageRef | number {
  return retainedImages[key] ?? sources[key];
}
