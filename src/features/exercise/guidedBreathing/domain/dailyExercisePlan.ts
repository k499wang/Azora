import type { MindMapAxis } from '../../../../lib/onboardingScores';
import type { TechniqueId } from '../techniqueCatalog';

export const GENERAL_DAYTIME_POOL_V1 = [
  'box',
  'resonance',
  'relaxing',
  'belly',
  'extended-exhale',
  'sitali',
  'triangle',
  'coherent-6',
] as const satisfies readonly TechniqueId[];

export const GENERAL_DAYTIME_POOL_V2 = [
  ...GENERAL_DAYTIME_POOL_V1,
  'deep-box',
  'wimhof',
  'bhastrika',
] as const satisfies readonly TechniqueId[];

export type GeneralDaytimeTechniqueId =
  (typeof GENERAL_DAYTIME_POOL_V1)[number];
export type GrowthAreaDaytimeTechniqueId =
  (typeof GENERAL_DAYTIME_POOL_V2)[number];
export type DailyPlanTechniqueId = GrowthAreaDaytimeTechniqueId;

export const GROWTH_AREA_TECHNIQUE_ORDER = {
  calm: [
    'extended-exhale',
    'resonance',
    'relaxing',
    'belly',
    'sitali',
    'coherent-6',
    'triangle',
    'box',
  ],
  recovery: [
    'resonance',
    'coherent-6',
    'relaxing',
    'belly',
    'extended-exhale',
    'triangle',
    'sitali',
    'box',
  ],
  focus: [
    'box',
    'resonance',
    'triangle',
    'coherent-6',
    'belly',
    'extended-exhale',
    'sitali',
    'relaxing',
  ],
  resilience: [
    'resonance',
    'box',
    'sitali',
    'triangle',
    'coherent-6',
    'extended-exhale',
    'belly',
    'relaxing',
  ],
  breathEase: [
    'belly',
    'resonance',
    'relaxing',
    'coherent-6',
    'extended-exhale',
    'sitali',
    'triangle',
    'box',
  ],
} as const satisfies Record<
  MindMapAxis,
  readonly GeneralDaytimeTechniqueId[]
>;

export const GROWTH_AREA_TECHNIQUE_ORDER_V2 = {
  calm: [
    'extended-exhale',
    'resonance',
    'relaxing',
    'belly',
    'sitali',
    'coherent-6',
    'triangle',
    'box',
    'deep-box',
    'wimhof',
    'bhastrika',
  ],
  recovery: [
    'resonance',
    'coherent-6',
    'relaxing',
    'belly',
    'extended-exhale',
    'triangle',
    'sitali',
    'deep-box',
    'box',
    'wimhof',
    'bhastrika',
  ],
  focus: [
    'box',
    'triangle',
    'deep-box',
    'resonance',
    'bhastrika',
    'coherent-6',
    'wimhof',
    'belly',
    'extended-exhale',
    'sitali',
    'relaxing',
  ],
  resilience: [
    'resonance',
    'box',
    'sitali',
    'triangle',
    'deep-box',
    'coherent-6',
    'wimhof',
    'extended-exhale',
    'bhastrika',
    'belly',
    'relaxing',
  ],
  breathEase: [
    'belly',
    'relaxing',
    'resonance',
    'coherent-6',
    'extended-exhale',
    'sitali',
    'triangle',
    'box',
    'deep-box',
    'wimhof',
    'bhastrika',
  ],
} as const satisfies Record<
  MindMapAxis,
  readonly GrowthAreaDaytimeTechniqueId[]
>;

type SevenDayTechniqueIds<T extends string> = readonly [T, T, T, T, T, T, T];

export interface DailyPlanExercisesV1 {
  version: 1;
  poolVersion: 'general_daytime_v1';
  startsOn: string;
  techniqueIds: SevenDayTechniqueIds<GeneralDaytimeTechniqueId>;
}

export interface DailyPlanExercisesV2 {
  version: 2;
  poolVersion: 'growth_area_daytime_v2';
  growthAreaAxis: MindMapAxis;
  startsOn: string;
  techniqueIds: SevenDayTechniqueIds<GrowthAreaDaytimeTechniqueId>;
}

export type DailyPlanExercises = DailyPlanExercisesV1 | DailyPlanExercisesV2;

export type DailyPlanExercisesReadResult =
  | { status: 'available'; plan: DailyPlanExercises }
  | { status: 'missing' }
  | { status: 'invalid_v1' }
  | { status: 'invalid_v2' }
  | { status: 'unsupported' };

interface BuildSevenDayExercisePlanInput {
  userId: string;
  primaryTechniqueId: string | null | undefined;
  startsOn: string;
}

interface BuildGrowthAreaSevenDayExercisePlanInput {
  primaryTechniqueId: string | null | undefined;
  growthAreaAxis: MindMapAxis;
  startsOn: string;
}

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_IN_MS = 86_400_000;

function parseLocalDate(value: unknown): number | null {
  if (typeof value !== 'string') return null;

  const match = LOCAL_DATE_PATTERN.exec(value);
  if (match == null) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcTimestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(utcTimestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return utcTimestamp;
}

function stableHash(value: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
}

function isGeneralDaytimeTechniqueId(
  value: unknown,
): value is GeneralDaytimeTechniqueId {
  return (
    typeof value === 'string' &&
    GENERAL_DAYTIME_POOL_V1.includes(value as GeneralDaytimeTechniqueId)
  );
}

function isGrowthAreaDaytimeTechniqueId(
  value: unknown,
): value is GrowthAreaDaytimeTechniqueId {
  return (
    typeof value === 'string' &&
    GENERAL_DAYTIME_POOL_V2.includes(value as GrowthAreaDaytimeTechniqueId)
  );
}

function isMindMapAxis(value: unknown): value is MindMapAxis {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(GROWTH_AREA_TECHNIQUE_ORDER_V2, value)
  );
}

function sanitizeV1Plan(record: Record<string, unknown>): DailyPlanExercisesV1 | null {
  const techniqueIds = record.techniqueIds;
  if (
    record.version !== 1 ||
    record.poolVersion !== 'general_daytime_v1' ||
    !isValidDailyPlanLocalDate(record.startsOn) ||
    !Array.isArray(techniqueIds) ||
    techniqueIds.length !== 7 ||
    !techniqueIds.every(isGeneralDaytimeTechniqueId) ||
    new Set(techniqueIds).size !== 7
  ) {
    return null;
  }

  return {
    version: 1,
    poolVersion: 'general_daytime_v1',
    startsOn: record.startsOn,
    techniqueIds: [
      ...techniqueIds,
    ] as unknown as SevenDayTechniqueIds<GeneralDaytimeTechniqueId>,
  };
}

function sanitizeV2Plan(record: Record<string, unknown>): DailyPlanExercisesV2 | null {
  const techniqueIds = record.techniqueIds;
  if (
    record.version !== 2 ||
    record.poolVersion !== 'growth_area_daytime_v2' ||
    !isMindMapAxis(record.growthAreaAxis) ||
    !isValidDailyPlanLocalDate(record.startsOn) ||
    !Array.isArray(techniqueIds) ||
    techniqueIds.length !== 7 ||
    !techniqueIds.every(isGrowthAreaDaytimeTechniqueId) ||
    new Set(techniqueIds).size !== 7
  ) {
    return null;
  }

  return {
    version: 2,
    poolVersion: 'growth_area_daytime_v2',
    growthAreaAxis: record.growthAreaAxis,
    startsOn: record.startsOn,
    techniqueIds: [
      ...techniqueIds,
    ] as unknown as SevenDayTechniqueIds<GrowthAreaDaytimeTechniqueId>,
  };
}

export function isValidDailyPlanLocalDate(value: unknown): value is string {
  return parseLocalDate(value) != null;
}

export function buildSevenDayExercisePlan({
  userId,
  primaryTechniqueId,
  startsOn,
}: BuildSevenDayExercisePlanInput): DailyPlanExercisesV1 {
  if (userId.trim().length === 0) {
    throw new Error('A user id is required to build a daily exercise plan.');
  }
  if (!isValidDailyPlanLocalDate(startsOn)) {
    throw new Error(`Invalid daily exercise plan start date: "${startsOn}".`);
  }

  const available = GENERAL_DAYTIME_POOL_V1.filter(
    (techniqueId) => techniqueId !== primaryTechniqueId,
  );
  const offset = stableHash(userId) % available.length;
  const rotated = [
    ...available.slice(offset),
    ...available.slice(0, offset),
  ];
  const techniqueIds = rotated.slice(
    0,
    7,
  ) as unknown as SevenDayTechniqueIds<GeneralDaytimeTechniqueId>;

  return {
    version: 1,
    poolVersion: 'general_daytime_v1',
    startsOn,
    techniqueIds,
  };
}

export function buildGrowthAreaSevenDayExercisePlan({
  primaryTechniqueId,
  growthAreaAxis,
  startsOn,
}: BuildGrowthAreaSevenDayExercisePlanInput): DailyPlanExercisesV1 {
  if (!isValidDailyPlanLocalDate(startsOn)) {
    throw new Error(`Invalid daily exercise plan start date: "${startsOn}".`);
  }

  const techniqueIds = GROWTH_AREA_TECHNIQUE_ORDER[growthAreaAxis]
    .filter((techniqueId) => techniqueId !== primaryTechniqueId)
    .slice(0, 7) as unknown as SevenDayTechniqueIds<GeneralDaytimeTechniqueId>;

  return {
    version: 1,
    poolVersion: 'general_daytime_v1',
    startsOn,
    techniqueIds,
  };
}

export function buildGrowthAreaSevenDayExercisePlanV2({
  primaryTechniqueId,
  growthAreaAxis,
  startsOn,
}: BuildGrowthAreaSevenDayExercisePlanInput): DailyPlanExercisesV2 {
  if (!isValidDailyPlanLocalDate(startsOn)) {
    throw new Error(`Invalid daily exercise plan start date: "${startsOn}".`);
  }

  const techniqueIds = GROWTH_AREA_TECHNIQUE_ORDER_V2[growthAreaAxis]
    .filter((techniqueId) => techniqueId !== primaryTechniqueId)
    .slice(0, 7) as unknown as SevenDayTechniqueIds<GrowthAreaDaytimeTechniqueId>;

  return {
    version: 2,
    poolVersion: 'growth_area_daytime_v2',
    growthAreaAxis,
    startsOn,
    techniqueIds,
  };
}

export function readDailyPlanExercises(
  raw: unknown,
): DailyPlanExercisesReadResult {
  if (raw == null) return { status: 'missing' };
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { status: 'unsupported' };
  }

  const record = raw as Record<string, unknown>;
  if (
    record.version === 1 &&
    record.poolVersion === 'general_daytime_v1'
  ) {
    const plan = sanitizeV1Plan(record);
    return plan == null ? { status: 'invalid_v1' } : { status: 'available', plan };
  }
  if (
    record.version === 2 &&
    record.poolVersion === 'growth_area_daytime_v2'
  ) {
    const plan = sanitizeV2Plan(record);
    return plan == null ? { status: 'invalid_v2' } : { status: 'available', plan };
  }
  if (record.poolVersion === 'growth_area_daytime_v2') {
    return { status: 'invalid_v2' };
  }
  if (
    record.poolVersion !== undefined &&
    record.poolVersion !== 'general_daytime_v1'
  ) {
    return { status: 'unsupported' };
  }
  if (record.version === 2) {
    return { status: 'invalid_v2' };
  }
  if (typeof record.version === 'number' && record.version !== 1) {
    return { status: 'unsupported' };
  }
  if (record.version === 1 || record.poolVersion === 'general_daytime_v1') {
    return { status: 'invalid_v1' };
  }

  return { status: 'unsupported' };
}

export function sanitizeDailyPlanExercises(
  raw: unknown,
): DailyPlanExercises | null {
  const result = readDailyPlanExercises(raw);
  return result.status === 'available' ? result.plan : null;
}

export function shouldRepairLegacyDailyPlan(
  result: DailyPlanExercisesReadResult,
): boolean {
  return result.status === 'missing' || result.status === 'invalid_v1';
}

export function resolveDailyExerciseTechniqueIds(
  plan: DailyPlanExercises,
  excludedTechniqueId?: string | null,
): SevenDayTechniqueIds<DailyPlanTechniqueId> {
  const techniqueIds = [...plan.techniqueIds] as DailyPlanTechniqueId[];
  if (excludedTechniqueId == null) {
    return techniqueIds as unknown as SevenDayTechniqueIds<DailyPlanTechniqueId>;
  }

  const excludedIndex = techniqueIds.findIndex(
    (techniqueId) => techniqueId === excludedTechniqueId,
  );
  if (excludedIndex < 0) {
    return techniqueIds as unknown as SevenDayTechniqueIds<DailyPlanTechniqueId>;
  }

  const replacementOrder = plan.version === 2
    ? GROWTH_AREA_TECHNIQUE_ORDER_V2[plan.growthAreaAxis]
    : GENERAL_DAYTIME_POOL_V1;
  const replacement = replacementOrder.find(
    (techniqueId) =>
      techniqueId !== excludedTechniqueId &&
      !techniqueIds.includes(techniqueId),
  );

  if (replacement != null) {
    techniqueIds[excludedIndex] = replacement;
  }

  return techniqueIds as unknown as SevenDayTechniqueIds<DailyPlanTechniqueId>;
}

export function resolveDailyExerciseTechniqueId(
  plan: DailyPlanExercises,
  todayLocalDate: string,
  excludedTechniqueId?: string | null,
): DailyPlanTechniqueId {
  const startsOnTimestamp = parseLocalDate(plan.startsOn);
  const todayTimestamp = parseLocalDate(todayLocalDate);

  if (startsOnTimestamp == null || todayTimestamp == null) {
    throw new Error(`Invalid daily exercise plan date: "${todayLocalDate}".`);
  }

  const elapsedDays = Math.max(
    0,
    Math.floor((todayTimestamp - startsOnTimestamp) / DAY_IN_MS),
  );
  const techniqueIds = resolveDailyExerciseTechniqueIds(
    plan,
    excludedTechniqueId,
  );

  return techniqueIds[elapsedDays % 7];
}
