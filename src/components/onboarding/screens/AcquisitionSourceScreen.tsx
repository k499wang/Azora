import Icon from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import {
  ACQUISITION_SOURCE_OPTIONS,
  type AcquisitionSourceId,
} from '../data/acquisitionOptions';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionCardGrid from '../OnboardingOptionCardGrid';
import type { OnboardingOptionIconName } from '../OnboardingOptionIcon';

const ACQUISITION_SOURCE_ICONS: Record<
  AcquisitionSourceId,
  OnboardingOptionIconName
> = {
  instagram: 'instagram',
  tiktok: 'music-note',
  facebook: 'facebook',
  reddit: 'reddit',
  app_store_search: 'apple-ios',
  google_search: 'google',
  friend_or_family: 'account-group-outline',
  other: 'dots-horizontal-circle-outline',
};

interface AcquisitionSourceScreenProps {
  value: AcquisitionSourceId | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (id: AcquisitionSourceId) => void;
  onContinue: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

export default function AcquisitionSourceScreen({
  value,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: AcquisitionSourceScreenProps) {
  return (
    <OnboardingScreenLayout
      title="How did you first hear about Azora?"
      subtitle="It helps us keep making what actually reached you."
      progress={stepIndex / stepCount}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <OnboardingPrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={value == null}
        />
      }
    >
      <OnboardingOptionCardGrid
        options={ACQUISITION_SOURCE_OPTIONS.map((option) => ({
          id: option.id,
          title: option.title,
          accent: option.accent,
          icon: ACQUISITION_SOURCE_ICONS[option.id],
        }))}
        selectedIds={value ? [value] : []}
        onSelect={onSelect}
        renderGlyph={(option) =>
          option.id === 'tiktok' ? (
            <Icon name="tiktok" size={96} color={colors.text.inverse} />
          ) : null
        }
      />
    </OnboardingScreenLayout>
  );
}
