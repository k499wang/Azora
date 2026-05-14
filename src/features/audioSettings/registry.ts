import { ambientCategory } from './catalog/ambient';
import { chimeCategory } from './catalog/chimes';
import { voiceCategory } from './catalog/voices';
import type { AudioCategory, AudioCategoryId, AudioOption } from './types';

export const audioCategories: AudioCategory[] = [
  voiceCategory,
  ambientCategory,
  chimeCategory,
];

const categoriesById = new Map<AudioCategoryId, AudioCategory>(
  audioCategories.map((c) => [c.id, c]),
);

export function getAudioCategory(id: AudioCategoryId): AudioCategory | undefined {
  return categoriesById.get(id);
}

export function getAudioOption(
  categoryId: AudioCategoryId,
  optionId: string | null,
): AudioOption | undefined {
  if (optionId == null) return undefined;
  return getAudioCategory(categoryId)?.options.find((o) => o.id === optionId);
}
