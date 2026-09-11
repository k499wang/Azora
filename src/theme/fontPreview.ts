export const fontPreviewNames = [
  'balsamiq',
  'fredoka',
  'outfit',
] as const;

export type FontPreviewName = (typeof fontPreviewNames)[number];
export type FontRole = 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';

// Change this value, save the file, and let Fast Refresh update the app.
export const ACTIVE_FONT_PREVIEW: FontPreviewName = 'fredoka';

type FontWeight = '300' | '400' | '500' | '600' | '700' | '800';
type FontDefinition = Record<FontRole, { family: string; weight: FontWeight }>;

const balsamiq: FontDefinition = {
  light: { family: 'BalsamiqSans-Regular', weight: '400' },
  regular: { family: 'BalsamiqSans-Regular', weight: '400' },
  medium: { family: 'BalsamiqSans-Regular', weight: '400' },
  semibold: { family: 'BalsamiqSans-Bold', weight: '700' },
  bold: { family: 'BalsamiqSans-Bold', weight: '700' },
  heavy: { family: 'BalsamiqSans-Bold', weight: '700' },
};

export const fontPreviewDefinitions: Record<FontPreviewName, FontDefinition> = {
  balsamiq,
  fredoka: {
    light: { family: 'Fredoka-Regular', weight: '400' },
    regular: { family: 'Fredoka-Regular', weight: '400' },
    medium: { family: 'Fredoka-Medium', weight: '500' },
    semibold: { family: 'Fredoka-Medium', weight: '500' },
    bold: { family: 'Fredoka-SemiBold', weight: '600' },
    heavy: { family: 'Fredoka-SemiBold', weight: '600' },
  },
  outfit: {
    light: { family: 'Outfit-Light', weight: '300' },
    regular: { family: 'Outfit-Regular', weight: '400' },
    medium: { family: 'Outfit-Medium', weight: '500' },
    semibold: { family: 'Outfit-SemiBold', weight: '600' },
    bold: { family: 'Outfit-SemiBold', weight: '600' },
    heavy: { family: 'Outfit-ExtraBold', weight: '800' },
  },
};

export function resolveFontPreview(
  requested: string | undefined,
  isDevelopment: boolean,
): { name: FontPreviewName; roles: FontDefinition } {
  const validRequest = fontPreviewNames.find((name) => name === requested);
  const name = isDevelopment && validRequest ? validRequest : 'balsamiq';

  return { name, roles: fontPreviewDefinitions[name] };
}
