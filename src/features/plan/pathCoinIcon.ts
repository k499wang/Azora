import type { IconName } from '../../components/common/icons/paths';
import type { AttentionScriptId } from '../attention/domain/attentionScripts';
import type { TechniqueId } from '../exercise/guidedBreathing/techniqueCatalog';
import {
  PROGRAM_ACTIVITIES,
  programDayDefinition,
  type ProgramPresetRevision,
} from '../program/domain/programCatalogue';

const TECHNIQUE_COIN: Record<TechniqueId, IconName> = {
  box: 'coin-box',
  'deep-box': 'coin-box',
  '478': 'coin-cloud',
  wimhof: 'coin-bolt',
  bhastrika: 'coin-bolt',
  resonance: 'coin-wave',
  'coherent-6': 'coin-wave',
  relaxing: 'coin-leaf',
  belly: 'coin-balloon',
  'extended-exhale': 'coin-wind',
  sitali: 'coin-snowflake',
  triangle: 'coin-triangle',
  'morning-charge': 'coin-sun',
  'night-settle': 'coin-moon',
  'sleep-descent': 'coin-moon',
};

const ATTENTION_COIN: Record<AttentionScriptId, IconName> = {
  '54321': 'coin-eye',
  'muscle-release': 'coin-drop',
};

/** What the day's Reset looks like on its coin, so the path reads as a mix of practices. */
export function dayCoinIcon(preset: ProgramPresetRevision | null, day: number): IconName {
  if (preset == null) return 'coin-star';
  const activities = (programDayDefinition(preset, day)?.activityIds ?? []).flatMap((id) => {
    const activity = PROGRAM_ACTIVITIES.get(id);
    return activity == null ? [] : [activity];
  });
  const reset = activities.find((activity) => activity.delivery.modality !== 'lesson');
  switch (reset?.delivery.modality) {
    case 'breathing':
      return TECHNIQUE_COIN[reset.delivery.techniqueId];
    case 'attention':
      return ATTENTION_COIN[reset.delivery.scriptId];
    case 'reflection':
      return 'coin-pencil';
    default:
      return activities.length > 0 ? 'coin-book' : 'coin-star';
  }
}
