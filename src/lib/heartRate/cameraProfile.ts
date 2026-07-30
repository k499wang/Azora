export type HeartRateCameraLayout = 'dual' | 'triple' | 'unknown';
export type HeartRatePhysicalCamera =
  | 'wide-angle-camera'
  | 'telephoto-camera';

export interface HeartRateCameraProfile {
  readonly layout: HeartRateCameraLayout;
  readonly physicalCamera: HeartRatePhysicalCamera;
  readonly target: 'bottom camera' | 'rightmost camera' | 'camera lens';
  readonly title: string;
}

const DUAL_CAMERA_PROFILE: HeartRateCameraProfile = {
  layout: 'dual',
  physicalCamera: 'wide-angle-camera',
  target: 'bottom camera',
  title: 'Cover the bottom camera',
};

const TRIPLE_CAMERA_PROFILE: HeartRateCameraProfile = {
  layout: 'triple',
  physicalCamera: 'telephoto-camera',
  target: 'rightmost camera',
  title: 'Cover the rightmost camera',
};

const UNKNOWN_CAMERA_PROFILE: HeartRateCameraProfile = {
  layout: 'unknown',
  physicalCamera: 'wide-angle-camera',
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

export function getHeartRateCameraProfile(
  modelName: string | null,
): HeartRateCameraProfile {
  if (modelName == null) return UNKNOWN_CAMERA_PROFILE;
  return CAMERA_PROFILES_BY_MODEL[modelName] ?? UNKNOWN_CAMERA_PROFILE;
}
