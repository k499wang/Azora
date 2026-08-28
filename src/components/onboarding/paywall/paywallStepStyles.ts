import { StyleSheet } from 'react-native';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';

export const TESTIMONIAL_CARD_WIDTH = 268;

const TIMELINE_RAIL_WIDTH = 34;
/**
 * A label line plus two lines of body. Pinning the copy blocks to a shared
 * floor is what keeps the icons evenly spaced down the rail — without it their
 * gaps track however each body happens to wrap, and three near-identical
 * paragraphs still drift a few points apart.
 */
const TIMELINE_COPY_MIN_HEIGHT =
  typography.heading.heading1.lineHeight +
  spacing.xs +
  typography.body.medium.lineHeight * 2;

export const paywallStepStyles = StyleSheet.create({
  proofCard: {
    ...card.base,
    ...card.shadow,
    gap: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
  },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 70,
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  proofLogo: {
    width: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofCopy: {
    flex: 1,
    gap: 2,
  },
  proofLabel: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  proofDetail: {
    ...typography.caption.caption1,
    color: colors.text.secondary,
  },
  proofDivider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
  },
  unlockSection: {
    gap: spacing.sm,
  },
  unlockTitle: {
    ...typography.heading.heading2,
    fontFamily: fonts.heavy,
    fontWeight: '800',
    color: colors.text.primary,
  },
  planIntroText: {
    ...typography.body.small,
    color: colors.text.secondary,
    paddingHorizontal: spacing.xs,
  },
  stepContainer: {
    gap: spacing.md,
  },
  choosePlanContainer: {
    gap: spacing.xs,
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
    top: 56,
    right: 58,
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
    color: colors.text.secondary,
    textAlign: 'left',
  },
  title: {
    ...typography.title.title1,
    fontSize: 30,
    lineHeight: 38,
    fontFamily: fonts.heavy,
    fontWeight: '800',
    color: colors.text.primary,
    textAlign: 'left',
  },
  titleDivider: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  stepHeader: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  stepTitle: {
    ...typography.title.title1,
    fontSize: 30,
    lineHeight: 38,
    fontFamily: fonts.heavy,
    fontWeight: '800',
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
    fontFamily: fonts.heavy,
    fontWeight: '800',
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
    color: colors.primary.blue600,
    textAlign: 'left',
  },
  timeline: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    // The rail spans the padding box, so these are what let it run on above the
    // first icon and past the last block rather than stopping level with them.
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  // One unbroken rail behind every icon rather than dots joined by segments:
  // the trial is a single stretch of time, and three separate dots read as
  // three unrelated events. Absolutely positioned so the rows above it can be
  // any height — copy that wraps to a third line cannot desync the two columns.
  timelineRail: {
    position: 'absolute',
    left: spacing.md,
    top: 0,
    bottom: 0,
    width: TIMELINE_RAIL_WIDTH,
    borderRadius: TIMELINE_RAIL_WIDTH / 2,
    borderCurve: 'continuous',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  timelineRowLast: {
    marginBottom: 0,
  },
  // One label-line tall, so each icon centres on its own heading rather than on
  // the copy block, whose height varies with how the body wraps.
  timelineIconSlot: {
    width: TIMELINE_RAIL_WIDTH,
    height: typography.heading.heading1.lineHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCopy: {
    flex: 1,
    minHeight: TIMELINE_COPY_MIN_HEIGHT,
  },
  timelineLabel: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    color: colors.text.primary,
  },
  timelineBody: {
    ...typography.body.medium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  testimonialScroll: {
    marginHorizontal: -spacing.lg,
    marginTop: spacing.md,
    // The scroller must not clip the cards' shadows.
    marginBottom: -spacing.sm,
    overflow: 'visible',
  },
  testimonialRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  testimonialCard: {
    ...card.base,
    ...card.shadow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
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
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  // Side by side, so both prices are readable against each other without a
  // scroll or a glance down the page.
  planCards: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
  },
  planCardsNoTrial: {
    marginTop: spacing.lg,
  },
});
