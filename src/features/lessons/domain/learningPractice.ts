export interface LearningPracticeRecord {
  programDay: number;
  lessonId: string;
  response: 'tried' | 'adapted' | 'later' | 'tooHard' | 'unclear';
  helpful: boolean | null;
  updatedAt: string;
}

export type LearningPracticeInput = Omit<LearningPracticeRecord, 'updatedAt'> & { updatedAt?: string };

export function isLearningPracticeRecord(value: unknown): value is LearningPracticeRecord {
  if (value == null || typeof value !== 'object') return false;
  const row = value as Partial<LearningPracticeRecord>;
  return Number.isInteger(row.programDay) && row.programDay! >= 1 && row.programDay! <= 84 &&
    typeof row.lessonId === 'string' && row.lessonId.length > 0 && row.lessonId.length <= 160 &&
    ['tried', 'adapted', 'later', 'tooHard', 'unclear'].includes(row.response ?? '') &&
    (row.helpful === null || ((row.response === 'tried' || row.response === 'adapted') && typeof row.helpful === 'boolean')) &&
    typeof row.updatedAt === 'string' && Number.isFinite(Date.parse(row.updatedAt));
}

export function parseLearningPractice(raw: string | null): LearningPracticeRecord[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(value)) return [];
    const days = new Map<number, LearningPracticeRecord>();
    for (const row of value.filter(isLearningPracticeRecord)) {
      const previous = days.get(row.programDay);
      if (previous == null || Date.parse(row.updatedAt) >= Date.parse(previous.updatedAt)) days.set(row.programDay, row);
    }
    return [...days.values()].sort((a, b) => a.programDay - b.programDay).slice(-84);
  } catch { return []; }
}
