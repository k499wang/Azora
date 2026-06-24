import FeatureInfoDialog from '../common/FeatureInfoDialog';
import { azoraLevels } from '../../lib/azoraScore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AzoraScoreInfoDialog({ visible, onClose }: Props) {
  return (
    <FeatureInfoDialog
      visible={visible}
      onClose={onClose}
      title="Azora Score"
      intro="Your Azora Score rates each breath hold from 0 to 100. Longer holds and a bigger heart-rate drop during the hold both raise it — a sign of stronger breath control and a calmer nervous system."
      sections={azoraLevels()
        .slice()
        .reverse()
        .map((level) => ({
          heading: level.label,
          body: `Score ${level.minScore}–${level.maxScore}`,
        }))}
    />
  );
}
