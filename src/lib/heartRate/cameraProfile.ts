export type HeartRateCameraLayout = 'single' | 'dual' | 'triple' | 'unknown';
export type HeartRatePhysicalCamera =
  | 'wide-angle-camera'
  | 'telephoto-camera';

export interface HeartRateCameraProfile {
  readonly layout: HeartRateCameraLayout;
  /**
   * Deliberately never names a direction. Lens order and position vary across
   * models, so a wrong "rightmost"/"bottom" is worse than no direction at all —
   * the highlighted illustration and the live preview point at the right lens.
   */
  readonly target: 'camera lens';
  readonly title: string;
}

const DUAL_CAMERA_PROFILE: HeartRateCameraProfile = {
  layout: 'dual',
  target: 'camera lens',
  title: 'Cover the camera lens',
};

const SINGLE_CAMERA_PROFILE: HeartRateCameraProfile = {
  layout: 'single',
  target: 'camera lens',
  title: 'Cover the camera lens',
};

const TRIPLE_CAMERA_PROFILE: HeartRateCameraProfile = {
  layout: 'triple',
  target: 'camera lens',
  title: 'Cover the camera lens',
};

const UNKNOWN_CAMERA_PROFILE: HeartRateCameraProfile = {
  layout: 'unknown',
  target: 'camera lens',
  title: 'Cover the camera lens',
};

/**
 * iPhones with one rear lens. Their single lens sits in a body of its own, so
 * they get their own placement art; everything else follows the two-lens shape.
 */
const SINGLE_LENS_IPHONE_MARKETING_NAMES = [
  'iPhone 16e',
  'iPhone Air',
];

const IPHONE_SE_MODEL_IDS = new Set([
  'iPhone8,4',
  'iPhone12,8',
  'iPhone14,6',
]);

function isIPhone(modelName: string | null): modelName is string {
  return modelName != null && modelName.startsWith('iPhone');
}

function isSingleLensIPhone(
  modelName: string | null,
  modelId?: string | null,
): boolean {
  if (modelId != null && IPHONE_SE_MODEL_IDS.has(modelId)) return true;
  if (modelName == null) return false;
  if (modelName.startsWith('iPhone SE')) return true;
  return SINGLE_LENS_IPHONE_MARKETING_NAMES.some((name) =>
    modelName.startsWith(name),
  );
}

/**
 * Every iPhone resolves to a layout so the placement art matches the phone in
 * the user's hand: the Pro body carries three lenses and every other iPhone the
 * app runs on carries two, whatever generation they are. Anything that isn't a
 * known iPhone — an iPad, an Android, an unavailable model name — stays
 * `unknown` and the placement UI falls back to its written instruction.
 */
export function getHeartRateCameraProfile(
  modelName: string | null,
  modelId?: string | null,
): HeartRateCameraProfile {
  if (isSingleLensIPhone(modelName, modelId)) return SINGLE_CAMERA_PROFILE;
  if (!isIPhone(modelName)) return UNKNOWN_CAMERA_PROFILE;
  return modelName.includes('Pro') ? TRIPLE_CAMERA_PROFILE : DUAL_CAMERA_PROFILE;
}

/**
 * The lens a reading is taken through, which the placement step tells the user
 * to cover: the telephoto on a Pro body, the wide-angle on everything else.
 * Same "Pro means three lenses" rule as the layout, so art and measurement can
 * never disagree about which body they are looking at.
 */
export function getHeartRatePhysicalCamera(
  modelName: string | null,
): HeartRatePhysicalCamera {
  return isIPhone(modelName) && modelName.includes('Pro')
    ? 'telephoto-camera'
    : 'wide-angle-camera';
}
