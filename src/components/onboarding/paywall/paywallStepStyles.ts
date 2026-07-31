import { StyleSheet } from 'react-native';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';

export const TESTIMONIAL_CARD_WIDTH = 268;

export const paywallStepStyles = StyleSheet.create({
  stepContainer: {
    gap: spacing.xl,
  },
  choosePlanContainer: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  heroContainer: {
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  bellWrap: {
    marginTop: spacing.sm,
  },
  bellHint: {
    ...typography.body.small,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 46,
    right: 48,
    minWidth: 52,
    height: 52,
    borderRadius: 26,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[500],
  },
  bellBadgeText: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.neutral[0],
  },
  headerCopy: {
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  eyebrow: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.paywall.textMuted,
    textAlign: 'left',
  },
  title: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 29,
    lineHeight: 36,
    color: colors.neutral[0],
    textAlign: 'left',
  },
  titleDivider: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.paywall.divider,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  stepHeader: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  stepTitle: {
    ...typography.display.display3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },
  stepTitleBrand: {
    color: colors.primary.blue600,
  },
  stepSubtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
    textAlign: 'center',
  },
  trialNote: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.primary.blue600,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  trialNoteDark: {
    color: colors.primary.blue200,
    textAlign: 'left',
  },
  timeline: {
    alignSelf: 'stretch',
    paddingRight: spacing.md,
    marginTop: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineRail: {
    alignItems: 'center',
    width: 38,
  },
  timelineIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary.blue600,
  },
  timelineIconUpcoming: {
    backgroundColor: colors.neutral[200],
  },
  timelineLine: {
    width: 16,
    flex: 1,
    minHeight: 36,
    backgroundColor: colors.primary.blue300,
  },
  timelineLineUpcoming: {
    backgroundColor: colors.neutral[200],
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  timelineLabel: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  timelineBody: {
    ...typography.body.small,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  testimonialScroll: {
    marginHorizontal: -spacing.lg,
  },
  testimonialRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  testimonialCard: {
    ...card.base,
    ...card.shadow,
    width: TESTIMONIAL_CARD_WIDTH,
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.elevated,
  },
  testimonialRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  testimonialStars: {
    flexDirection: 'row',
    gap: 2,
  },
  testimonialRatingValue: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  testimonialTitle: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  testimonialQuote: {
    ...typography.body.small,
    color: colors.text.secondary,
    flex: 1,
  },
  testimonialAttribution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  testimonialAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.neutral[200],
  },
  testimonialAuthor: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  cardsLoading: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderToggleWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  planCards: {
    gap: spacing.sm,
  },
  planCardsNoTrial: {
    marginTop: spacing.lg,
  },
});
