import { memo, useMemo } from 'react';
import { SvgXml } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { ICON_PATHS, type IconName } from './paths';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

/**
 * `SvgXml` parses the string it is handed, so a new string every render is a
 * new parse every render. All three inputs are primitives, so memoising the
 * component keeps unrelated parent renders — a grid of these re-rendering
 * because one tile's selection changed — from re-parsing every icon on it.
 */
function Icon({ name, size = 24, color = colors.text.primary }: IconProps) {
  const xml = useMemo(() => {
    const entry = ICON_PATHS[name];
    const body = typeof entry === 'string' ? entry : entry.body;
    const viewBox =
      typeof entry === 'string' ? '0 0 24 24' : entry.viewBox ?? '0 0 24 24';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}" color="${color}">${body}</svg>`;
  }, [name, size, color]);

  return <SvgXml xml={xml} width={size} height={size} />;
}

export default memo(Icon);

export type { IconName };
