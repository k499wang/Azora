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

export type GeneralDaytimeTechniqueId =
  (typeof GENERAL_DAYTIME_POOL_V1)[number];

export interface DailyPlanExercises {
  version: 1;
  poolVersion: 'general_daytime_v1';
  startsOn: string;
  techniqueIds: readonly [
    GeneralDaytimeTechniqueId,
    GeneralDaytimeTechniqueId,
    GeneralDaytimeTechniqueId,
    GeneralDaytimeTechniqueId,
    GeneralDaytimeTechniqueId,
    GeneralDaytimeTechniqueId,
    GeneralDaytimeTechniqueId,
  ];
}

interface BuildSevenDayExercisePlanInput {
  userId: string;
  primaryTechniqueId: string | null | undefined;
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

export function isValidDailyPlanLocalDate(value: unknown): value is string {
  return parseLocalDate(value) != null;
}

export function buildSevenDayExercisePlan({
  userId,
  primaryTechniqueId,
  startsOn,
}: BuildSevenDayExercisePlanInput): DailyPlanExercises {
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
  ) as unknown as DailyPlanExercises['techniqueIds'];

  return {
    version: 1,
    poolVersion: 'general_daytime_v1',
    startsOn,
    techniqueIds,
  };
}

export function sanitizeDailyPlanExercises(
  raw: unknown,
): DailyPlanExercises | null {
  if (raw == null || typeof raw !== 'object') return null;

  const record = raw as {
    version?: unknown;
    poolVersion?: unknown;
    startsOn?: unknown;
    techniqueIds?: unknown;
  };

  if (
    record.version !== 1 ||
    record.poolVersion !== 'general_daytime_v1' ||
    !isValidDailyPlanLocalDate(record.startsOn) ||
    !Array.isArray(record.techniqueIds) ||
    record.techniqueIds.length !== 7 ||
    !record.techniqueIds.every(isGeneralDaytimeTechniqueId) ||
    new Set(record.techniqueIds).size !== 7
  ) {
    return null;
  }

  return {
    version: 1,
    poolVersion: 'general_daytime_v1',
    startsOn: record.startsOn,
    techniqueIds: [
      ...record.techniqueIds,
    ] as unknown as DailyPlanExercises['techniqueIds'],
  };
}

export function resolveDailyExerciseTechniqueId(
  plan: DailyPlanExercises,
  todayLocalDate: string,
  excludedTechniqueId?: string | null,
): GeneralDaytimeTechniqueId {
  const startsOnTimestamp = parseLocalDate(plan.startsOn);
  const todayTimestamp = parseLocalDate(todayLocalDate);

  if (startsOnTimestamp == null || todayTimestamp == null) {
    throw new Error(`Invalid daily exercise plan date: "${todayLocalDate}".`);
  }

  const elapsedDays = Math.max(
    0,
    Math.floor((todayTimestamp - startsOnTimestamp) / DAY_IN_MS),
  );
  const eligibleTechniqueIds = excludedTechniqueId == null
    ? plan.techniqueIds
    : plan.techniqueIds.filter(
        (techniqueId) => techniqueId !== excludedTechniqueId,
      );
  const dayIndex = elapsedDays % eligibleTechniqueIds.length;

  return eligibleTechniqueIds[dayIndex] ?? plan.techniqueIds[0];
}
