import { memo, useMemo, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { OPTION_ICON_PATHS, type OptionIconName } from '../common/icons/optionIconPaths';
import { boldIconBody } from '../common/icons/boldIconBody';
import {
  ONBOARDING_ILLUSTRATION_CATALOG,
  type OnboardingIllustrationName,
} from '../common/icons/onboardingIllustrationCatalog';

type MaterialIconName = NonNullable<
  ComponentProps<typeof MaterialCommunityIcons>['name']
>;

export type OnboardingOptionIconName = OnboardingIllustrationName | OptionIconName | MaterialIconName;

interface OnboardingOptionIconProps {
  name: OnboardingOptionIconName;
  size?: number;
  selected?: boolean;
  color?: string;
}

/** Original full-colour objects, shared with the habit cards where they match. */
function OnboardingOptionIcon({
  name,
  size = 36,
  selected = false,
  color,
}: OnboardingOptionIconProps) {
  const tint = color ?? (selected ? colors.primary.blue500 : colors.playful.stone.base);
  const xml = useMemo(() => {
    if (Object.prototype.hasOwnProperty.call(ONBOARDING_ILLUSTRATION_CATALOG, name)) {
      const body = ONBOARDING_ILLUSTRATION_CATALOG[name as OnboardingIllustrationName];
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${body}</svg>`;
    }
    if (Object.prototype.hasOwnProperty.call(OPTION_ICON_PATHS, name)) {
      const entry = OPTION_ICON_PATHS[name as OptionIconName];
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${entry.viewBox}" color="${tint}">${boldIconBody(entry.body)}</svg>`;
    }
    return null;
  }, [name, tint]);

  return (
    <View style={[styles.slot, { width: size, height: size }]}>
      {xml ? (
        <SvgXml xml={xml} width={size} height={size} />
      ) : (
        <MaterialCommunityIcons
          name={name as MaterialIconName}
          size={size}
          color={tint}
        />
      )}
    </View>
  );
}

export default memo(OnboardingOptionIcon);

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
