import { Image, type ImageLoadOptions, type ImageRef } from 'expo-image';

export type OnboardingImageKey =
  | 'brainScan'
  | 'agreementQ1'
  | 'agreementQ2'
  | 'agreementQ3'
  | 'cameraPpg'
  | 'cameraPpgTriple'
  | 'signature'
  | 'oxfordLogo'
  | 'cambridgeLogo'
  | 'testimonialMaya'
  | 'testimonialDaniel'
  | 'testimonialPriya';

const sources: Record<OnboardingImageKey, number> = {
  brainScan: require('../../../assets/onboarding/brain-scan-comparison.webp'),
  agreementQ1: require('../../../assets/questions/q1.png'),
  agreementQ2: require('../../../assets/questions/q2.png'),
  agreementQ3: require('../../../assets/questions/q3.png'),
  cameraPpg: require('../../../assets/onboarding/camerappg.png'),
  cameraPpgTriple: require('../../../assets/onboarding/camerappg-triple.png'),
  signature: require('../../../assets/signature.png'),
  oxfordLogo: require('../../../assets/logos/oxford.png'),
  cambridgeLogo: require('../../../assets/logos/cambridge.png'),
  testimonialMaya: require('../../../assets/testimonials/maya-rivera.jpg'),
  testimonialDaniel: require('../../../assets/testimonials/daniel-koch.jpg'),
  testimonialPriya: require('../../../assets/testimonials/priya-shah.jpg'),
};

const loadOptions: Partial<Record<OnboardingImageKey, ImageLoadOptions>> = {
  brainScan: { maxWidth: 1200 },
  agreementQ1: { maxWidth: 1080 },
  agreementQ2: { maxWidth: 1080 },
  agreementQ3: { maxWidth: 1080 },
  cameraPpg: { maxWidth: 1200 },
  cameraPpgTriple: { maxWidth: 1200 },
  signature: { maxWidth: 1200 },
  cambridgeLogo: { maxWidth: 1200 },
  testimonialMaya: { maxWidth: 128 },
  testimonialDaniel: { maxWidth: 128 },
  testimonialPriya: { maxWidth: 128 },
};

const retainedImages: Partial<Record<OnboardingImageKey, ImageRef>> = {};
const pendingLoads: Partial<Record<OnboardingImageKey, Promise<ImageRef>>> = {};

function loadOnboardingImage(key: OnboardingImageKey): Promise<ImageRef> {
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

export async function loadCriticalOnboardingImages(): Promise<void> {
  const criticalKeys = Object.keys(sources) as OnboardingImageKey[];
  const results = await Promise.allSettled(
    criticalKeys.map((key) => loadOnboardingImage(key)),
  );

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      const key = criticalKeys[index];
      console.warn(
        `[images] Failed to predecode ${key} onboarding image`,
        result.reason,
      );
    }
  });
}

export function getOnboardingImageSource(
  key: OnboardingImageKey,
): ImageRef | number {
  return retainedImages[key] ?? sources[key];
}
