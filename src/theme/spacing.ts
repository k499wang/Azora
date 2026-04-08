export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 56,
  '5xl': 64,
  '6xl': 80,
  '7xl': 96,
} as const;

export const padding = {
  screen: {
    horizontal: spacing.lg,
    vertical: spacing.xl,
  },
  card: {
    horizontal: spacing.md,
    vertical: spacing.md,
  },
  button: {
    horizontal: spacing.lg,
    vertical: spacing.sm,
  },
  input: {
    horizontal: spacing.md,
    vertical: spacing.sm,
  },
} as const;

export const margin = {
  sectionGap: spacing.xl,
  itemGap: spacing.md,
  textGap: spacing.sm,
  tightGap: spacing.xs,
} as const;
