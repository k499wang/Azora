import { memo, useMemo, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { colors } from '../../theme/colors';
import {
  OPTION_ICON_PATHS,
  type OptionIconName,
} from '../common/icons/optionIconPaths';

type MaterialIconName = NonNullable<
  ComponentProps<typeof MaterialCommunityIcons>['name']
>;

/**
 * Solar's names win where the set has the glyph. The rest fall back to
 * Material, which is what the brand marks on "how did you hear about Azora?"
 * need — no icon set draws someone else's logo — and what the few glyphs Solar
 * has no answer for still use. A screen never mixes the two: the fallbacks are
 * whole screens, not stray rows.
 */
export type OnboardingOptionIconName = OptionIconName | MaterialIconName;

function isSolarIcon(name: OnboardingOptionIconName): name is OptionIconName {
  return name in OPTION_ICON_PATHS;
}

interface OnboardingOptionIconProps {
  name: OnboardingOptionIconName;
  size?: number;
  selected?: boolean;
  color?: string;
}

/**
 * An option's picture, drawn two-tone in the option's own colour.
 *
 * The glyphs are Solar's Bold Duotone weight, whose second layer is the same
 * `currentColor` at half opacity — so one accent paints both tones and the set
 * stays colourful without carrying a palette of its own. A monochrome icon at a
 * single weight read as a symbol on a form; this reads as a picture, which is
 * what the rows wanted all along.
 *
 * `SvgXml` re-parses the string it is handed on every render, so the component
 * is memoised on its primitives and the markup is built once per input.
 */
function OnboardingOptionIcon({
  name,
  size = 22,
  selected = false,
  color,
}: OnboardingOptionIconProps) {
  const tint =
    color ?? (selected ? colors.primary.blue600 : colors.accent[600]);

  const xml = useMemo(() => {
    if (!isSolarIcon(name)) return null;
    const entry = OPTION_ICON_PATHS[name];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${entry.viewBox}" width="${size}" height="${size}" color="${tint}">${entry.body}</svg>`;
  }, [name, size, tint]);

  return (
    <View style={styles.slot}>
      {xml == null ? (
        <MaterialCommunityIcons
          name={name as MaterialIconName}
          size={size}
          color={tint}
        />
      ) : (
        <SvgXml xml={xml} width={size} height={size} />
      )}
    </View>
  );
}

export default memo(OnboardingOptionIcon);

const styles = StyleSheet.create({
  slot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
