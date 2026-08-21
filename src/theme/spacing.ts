export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  mdPlus: 20,
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
    // App-standard screen margin — a touch roomier than Apple's 16pt default.
    horizontal: 18,
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
  // Generous section rhythm: 40px between sections, 24px under a section
  // title. Kept wider than the itemGap so sections read as distinct blocks.
  sectionGap: spacing['2xl'],
  resultSection: spacing.lg,
  itemGap: spacing.lg,
  textGap: spacing.sm,
  tightGap: spacing.xs,
} as const;
