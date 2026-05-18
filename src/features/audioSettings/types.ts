export type AudioCategoryId = 'voice' | 'ambient' | 'chime';

export interface AudioOption {
  id: string;
  label: string;
  asset: number | null;
  /**
   * Optional per-phase assets. Used by voice packs that need a different file
   * per breath phase. `asset` (above) is used for previews and as a fallback.
   */
  phaseAssets?: {
    inhale?: number;
    exhale?: number;
    hold?: number;
  };
  premium?: boolean;
}

export interface AudioCategory {
  id: AudioCategoryId;
  title: string;
  description: string;
  allowOff: boolean;
  previewable: boolean;
  options: AudioOption[];
}

import type { ExerciseDarkTheme } from '../../theme/exerciseDarkThemes';

export interface AudioPreferences {
  voice: string | null;
  ambient: string | null;
  chime: string | null;
  ambientVolume: number;
  themeId: ExerciseDarkTheme['id'];
}

export const OFF_OPTION_ID = '__off__';
