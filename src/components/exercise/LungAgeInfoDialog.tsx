import FeatureInfoDialog from '../common/FeatureInfoDialog';
import {
  lungAgeReferenceHolds,
  MAX_LUNG_AGE,
  MIN_LUNG_AGE,
} from '../../lib/lungAge';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const referenceBody = lungAgeReferenceHolds()
  .map((ref) => `Age ${ref.age} — about ${ref.medianSeconds}s`)
  .join('\n');

export default function LungAgeInfoDialog({ visible, onClose }: Props) {
  return (
    <FeatureInfoDialog
      visible={visible}
      onClose={onClose}
      title="Lung age"
      intro="Your lung age is the age whose typical breath hold matches yours. Hold longer than most people your age and it reads younger than you are; hold less and it reads older."
      sections={[
        {
          heading: 'How it is calculated',
          body: `Breath-hold time falls off steadily with age as lung capacity and CO2 tolerance decline. We model that decline as a curve, then read it backwards: your hold is matched against the typical hold at every age, and the age that fits becomes your lung age. Results are reported between ${MIN_LUNG_AGE} and ${MAX_LUNG_AGE} years.`,
        },
        {
          heading: 'Typical holds by age',
          body: referenceBody,
        },
        {
          heading: 'Reading your result',
          body: 'A hold exactly at the typical time for your age returns your own age. Every extra second pulls the number down. Because it comes from one hold, it moves with how rested, caffeinated, or stressed you are — the trend across weeks is what matters.',
        },
        {
          heading: 'Lowering it',
          body: 'Regular breath holds train CO2 tolerance, which is what most often limits the hold. Slower daily breathing and consistent practice both show up here within a week or two.',
        },
        {
          heading: 'Good to know',
          body: 'This is a fitness estimate from your breath hold, not a clinical lung-age measurement, and it is not a diagnosis.',
        },
      ]}
    />
  );
}
