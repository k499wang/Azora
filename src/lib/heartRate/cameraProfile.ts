export type HeartRateCameraLayout = 'dual' | 'triple' | 'unknown';
export type HeartRatePhysicalCamera =
  | 'wide-angle-camera'
  | 'telephoto-camera';

export interface HeartRateCameraProfile {
  readonly layout: HeartRateCameraLayout;
  readonly target: 'bottom camera' | 'rightmost camera' | 'camera lens';
  readonly title: string;
}

const DUAL_CAMERA_PROFILE: HeartRateCameraProfile = {
  layout: 'dual',
  target: 'bottom camera',
  title: 'Cover the bottom camera',
};

const TRIPLE_CAMERA_PROFILE: HeartRateCameraProfile = {
  layout: 'triple',
  target: 'rightmost camera',
  title: 'Cover the rightmost camera',
};

const UNKNOWN_CAMERA_PROFILE: HeartRateCameraProfile = {
  layout: 'unknown',
  target: 'camera lens',
  title: 'Cover the camera lens',
};

const CAMERA_PROFILES_BY_MODEL: Readonly<
  Record<string, HeartRateCameraProfile>
> = {
  'iPhone 16': DUAL_CAMERA_PROFILE,
  'iPhone 16 Plus': DUAL_CAMERA_PROFILE,
  'iPhone 16 Pro': TRIPLE_CAMERA_PROFILE,
  'iPhone 16 Pro Max': TRIPLE_CAMERA_PROFILE,
  'iPhone 17 Pro': TRIPLE_CAMERA_PROFILE,
  'iPhone 17 Pro Max': TRIPLE_CAMERA_PROFILE,
};

const TELEPHOTO_HEART_RATE_IPHONE_MODELS = new Set([
  'iPhone 11 Pro',
  'iPhone 11 Pro Max',
  'iPhone 12 Pro',
  'iPhone 12 Pro Max',
  'iPhone 13 Pro',
  'iPhone 13 Pro Max',
  'iPhone 14 Pro',
  'iPhone 14 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15 Pro Max',
  'iPhone 16 Pro',
  'iPhone 16 Pro Max',
  'iPhone 17 Pro',
  'iPhone 17 Pro Max',
]);

export function getHeartRateCameraProfile(
  modelName: string | null,
): HeartRateCameraProfile {
  if (modelName == null) return UNKNOWN_CAMERA_PROFILE;
  return CAMERA_PROFILES_BY_MODEL[modelName] ?? UNKNOWN_CAMERA_PROFILE;
}

export function getHeartRatePhysicalCamera(
  modelName: string | null,
): HeartRatePhysicalCamera {
  return modelName != null && TELEPHOTO_HEART_RATE_IPHONE_MODELS.has(modelName)
    ? 'telephoto-camera'
    : 'wide-angle-camera';
}
