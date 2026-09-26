import { Image, type ImageLoadOptions, type ImageRef } from 'expo-image';

export type OnboardingImageKey =
  | 'brainScan'
  | 'habitsFocusBrain'
  | 'azoSleeping'
  | 'azoAnalyzing'
  | 'heartHealthMascot'
  | 'heartRateWarmHands'
  | 'heartRateHoldStill'
  | 'agreementQ1'
  | 'agreementQ2'
  | 'agreementQ3'
  | 'cameraPlacementSingle'
  | 'cameraPlacementDual'
  | 'cameraPlacementTriple'
  | 'signature'
  | 'oxfordLogo'
  | 'cambridgeLogo'
  | 'testimonialMaya'
  | 'testimonialDaniel'
  | 'testimonialPriya'
  | 'testimonialNina'
  | 'expertMaya'
  | 'expertDaniel'
  | 'wellbeingVsCoffee'
  | 'azoGiftKoala';

const sources: Record<OnboardingImageKey, number> = {
  brainScan: require('../../../assets/onboarding/brain-scan-comparison.webp'),
  habitsFocusBrain: require('../../../assets/67e170ba-5417-402c-a580-4bf088ff1c84.png'),
  azoSleeping: require('../../../assets/Poses/koala_pose_sleeping.png'),
  azoAnalyzing: require('../../../assets/Poses/koala_pose_analyzing.png'),
  heartHealthMascot: require('../../../assets/app/heart_health_mascot_VERIFIED_TRANSPARENT.png'),
  heartRateWarmHands: require('../../../assets/onboarding/heart-rate-warm-hands.png'),
  heartRateHoldStill: require('../../../assets/onboarding/heart-rate-hold-still.png'),
  agreementQ1: require('../../../assets/onboarding/questions/q1.png'),
  agreementQ2: require('../../../assets/onboarding/questions/q2.png'),
  agreementQ3: require('../../../assets/onboarding/questions/q3.png'),
  cameraPlacementSingle: require('../../../assets/onboarding/camera-placement-single.webp'),
  cameraPlacementDual: require('../../../assets/onboarding/camera-placement-dual.webp'),
  cameraPlacementTriple: require('../../../assets/onboarding/camera-placement-triple.webp'),
  signature: require('../../../assets/brand/signature.png'),
  oxfordLogo: require('../../../assets/logos/oxford.webp'),
  cambridgeLogo: require('../../../assets/logos/cambridge.webp'),
  testimonialMaya: require('../../../assets/testimonials/maya-rivera.jpg'),
  testimonialDaniel: require('../../../assets/testimonials/daniel-koch.jpg'),
  testimonialPriya: require('../../../assets/testimonials/priya-shah.jpg'),
  testimonialNina: require('../../../assets/testimonials/nina-alvarez.jpg'),
  expertMaya: require('../../../assets/onboarding/experts/maya-bennett.jpg'),
  expertDaniel: require('../../../assets/onboarding/experts/daniel-brooks.jpg'),
  wellbeingVsCoffee: require('../../../assets/onboarding/wellbeing-vs-coffee.png'),
  azoGiftKoala: require('../../../assets/blue_koala_hugging_gift_transparent.png'),
};

const loadOptions: Partial<Record<OnboardingImageKey, ImageLoadOptions>> = {
  brainScan: { maxWidth: 1200 },
  habitsFocusBrain: { maxWidth: 720 },
  azoSleeping: { maxWidth: 900 },
  azoAnalyzing: { maxWidth: 870 },
  heartHealthMascot: { maxWidth: 900 },
  heartRateWarmHands: { maxWidth: 870 },
  heartRateHoldStill: { maxWidth: 870 },
  agreementQ1: { maxWidth: 1080 },
  agreementQ2: { maxWidth: 1080 },
  agreementQ3: { maxWidth: 1080 },
  cameraPlacementSingle: { maxWidth: 870 },
  cameraPlacementDual: { maxWidth: 870 },
  cameraPlacementTriple: { maxWidth: 870 },
  signature: { maxWidth: 1200 },
  oxfordLogo: { maxWidth: 823 },
  cambridgeLogo: { maxWidth: 861 },
  testimonialMaya: { maxWidth: 128 },
  testimonialDaniel: { maxWidth: 128 },
  testimonialPriya: { maxWidth: 128 },
  testimonialNina: { maxWidth: 128 },
  // Drawn at 48pt; 144px covers @3x.
  expertMaya: { maxWidth: 144 },
  expertDaniel: { maxWidth: 144 },
  wellbeingVsCoffee: { maxWidth: 1080 },
  azoGiftKoala: { maxWidth: 512 },
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
