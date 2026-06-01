import type { ViewStyle } from 'react-native';
import { colors } from './colors';

export const card: { base: ViewStyle; shadow: ViewStyle } = {
  base: {
    backgroundColor: colors.background.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  shadow: {
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
};
