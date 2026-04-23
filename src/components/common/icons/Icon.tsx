import { SvgXml } from 'react-native-svg';
import { ICON_PATHS, type IconName } from './paths';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export default function Icon({ name, size = 24, color = '#000' }: IconProps) {
  const body = ICON_PATHS[name];
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" color="${color}">${body}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} />;
}

export type { IconName };
