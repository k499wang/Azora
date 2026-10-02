import { attentionScriptTitle } from '../../features/attention/domain/attentionScripts';
import { useOpenAttentionReset } from '../../features/attention/useOpenAttentionReset';
import {
  ATTENTION_GLYPH,
  CATEGORY_STYLE,
} from '../../features/exercise/guidedBreathing/categoryPalette';
import { requireAttentionDelivery } from '../../features/program/domain/attentionActivities';
import type { FeatureAccessState } from '../../hooks/useFeatureAccess';
import type { AttentionResetSearchEntry } from './exerciseCatalog';
import ExerciseSearchResultRow from './ExerciseSearchResultRow';

interface AttentionResetSearchRowProps {
  entry: AttentionResetSearchEntry;
  exerciseAccess: FeatureAccessState;
}

export default function AttentionResetSearchRow({
  entry,
  exerciseAccess,
}: AttentionResetSearchRowProps) {
  const { scriptId, minutes } = requireAttentionDelivery(entry.activityId);
  const name = attentionScriptTitle(scriptId);
  const categoryStyle = CATEGORY_STYLE[entry.category];
  const duration = `~${minutes} min`;
  const locked = !exerciseAccess.allowed && !exerciseAccess.isLoading;
  const handlePress = useOpenAttentionReset({
    activityId: entry.activityId,
    exerciseAccess,
    sourceScreen: 'ExerciseSearch',
    sourceAction: 'exercise_search_result',
  });

  return (
    <ExerciseSearchResultRow
      title={name}
      metadata={duration}
      hue={categoryStyle.hue}
      glyph={ATTENTION_GLYPH[scriptId]}
      locked={locked}
      accessibilityLabel={`${name}, Guided Reset, ${duration}${locked ? ', Pro' : ''}`}
      accessibilityHint={locked ? 'Opens the Pro upgrade screen' : 'Starts this reset'}
      onPress={handlePress}
    />
  );
}
