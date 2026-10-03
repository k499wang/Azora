import { memo, useMemo } from 'react';
import { SvgXml } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { ICON_PATHS, type IconName } from './paths';
import { boldIconBody } from './boldIconBody';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  bold?: boolean;
}

/**
 * `SvgXml` parses the string it is handed, so a new string every render is a
 * new parse every render. All inputs are primitives, so memoising the
 * component keeps unrelated parent renders — a grid of these re-rendering
 * because one tile's selection changed — from re-parsing every icon on it.
 */
function Icon({ name, size = 24, color = colors.text.primary, bold = false }: IconProps) {
  const xml = useMemo(() => {
    const entry = ICON_PATHS[name];
    const body = typeof entry === 'string' ? entry : entry.body;
    const viewBox =
      typeof entry === 'string' ? '0 0 24 24' : entry.viewBox ?? '0 0 24 24';
    const renderedBody = bold ? boldIconBody(body) : body;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}" color="${color}">${renderedBody}</svg>`;
  }, [name, size, color, bold]);

  return <SvgXml xml={xml} width={size} height={size} />;
}

export default memo(Icon);

export type { IconName };
