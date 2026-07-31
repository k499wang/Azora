export type HeartRateCameraLayout = 'single' | 'dual' | 'triple' | 'unknown';
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

const SINGLE_CAMERA_PROFILE: HeartRateCameraProfile = {
  layout: 'single',
  target: 'camera lens',
  title: 'Cover the camera lens',
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
  'iPhone SE': SINGLE_CAMERA_PROFILE,
  'iPhone SE (2nd generation)': SINGLE_CAMERA_PROFILE,
  'iPhone SE (3rd generation)': SINGLE_CAMERA_PROFILE,
  'iPhone 16': DUAL_CAMERA_PROFILE,
  'iPhone 16 Plus': DUAL_CAMERA_PROFILE,
  'iPhone 16 Pro': TRIPLE_CAMERA_PROFILE,
  'iPhone 16 Pro Max': TRIPLE_CAMERA_PROFILE,
  'iPhone 17 Pro': TRIPLE_CAMERA_PROFILE,
  'iPhone 17 Pro Max': TRIPLE_CAMERA_PROFILE,
};

const IPHONE_SE_MODEL_IDS = new Set([
  'iPhone8,4',
  'iPhone12,8',
  'iPhone14,6',
]);

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
  modelId?: string | null,
): HeartRateCameraProfile {
  if (
    (modelName?.startsWith('iPhone SE') ?? false) ||
    (modelId != null && IPHONE_SE_MODEL_IDS.has(modelId))
  ) {
    return SINGLE_CAMERA_PROFILE;
  }
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
