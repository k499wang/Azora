import { MaterialCommunityIcons } from '@expo/vector-icons';
import Icon from '../../common/icons/Icon';
import {
  ACQUISITION_SOURCE_OPTIONS,
  type AcquisitionSourceId,
} from '../data/acquisitionOptions';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingOptionList from '../OnboardingOptionList';
import type { ComponentProps } from 'react';

/** Material's own names, so this screen cannot drift onto the duotone set. */
type MaterialIconName = NonNullable<
  ComponentProps<typeof MaterialCommunityIcons>['name']
>;

const ACQUISITION_SOURCE_ICONS: Record<AcquisitionSourceId, MaterialIconName> = {
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
      <OnboardingOptionList
        options={ACQUISITION_SOURCE_OPTIONS.map((option) => ({
          id: option.id,
          title: option.title,
          accent: option.accent,
          icon: ACQUISITION_SOURCE_ICONS[option.id],
        }))}
        selectedIds={value ? [value] : []}
        onSelect={onSelect}
        // Drawn here rather than by the shared option icon, which now renders
        // the duotone set: these rows are logos, and a logo is whatever the
        // company draws it as. Pinning them keeps this screen looking exactly
        // as it did when the rest of onboarding changed sets.
        renderGlyph={(option) =>
          option.id === 'tiktok' ? (
            <Icon name="tiktok" size={26} color={option.accent} />
          ) : (
            <MaterialCommunityIcons
              name={ACQUISITION_SOURCE_ICONS[option.id]}
              size={26}
              color={option.accent}
            />
          )
        }
      />
    </OnboardingScreenLayout>
  );
}
