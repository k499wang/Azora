import { StyleSheet } from 'react-native';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, scaleType, typography } from '../../../theme/typography';
import {
  scaleControl,
  scaleVisual,
} from '../onboardingVisualScale';

export const TESTIMONIAL_CARD_WIDTH = scaleControl(268);

const TIMELINE_RAIL_WIDTH = scaleControl(34);
/**
 * A label line plus two lines of body. Pinning the copy blocks to a shared
 * floor is what keeps the icons evenly spaced down the rail — without it their
 * gaps track however each body happens to wrap, and three near-identical
 * paragraphs still drift a few points apart.
 */
/**
 * The two-line copy under each timeline label. Its leading runs a touch tighter
 * than body.medium so the rows read as one block rather than three stacked
 * paragraphs, and the shared floor below is measured with the same number so
 * the icons stay evenly spaced.
 */
const TIMELINE_BODY_LINE_HEIGHT = typography.body.medium.lineHeight - 2;

const TIMELINE_COPY_MIN_HEIGHT =
  typography.heading.heading1.lineHeight +
  spacing.xs +
  TIMELINE_BODY_LINE_HEIGHT * 2;

export const paywallStepStyles = StyleSheet.create({
  proofCard: {
    ...card.base,
    ...card.shadow,
    gap: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.subtle,
  },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: scaleControl(70),
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  proofLogo: {
    width: scaleControl(78),
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
  // Pinned to the bell drawing, so both move together when the illustration
  // scale changes.
  bellBadge: {
    position: 'absolute',
    top: scaleVisual(56),
    right: scaleVisual(58),
    minWidth: scaleVisual(52),
    height: scaleVisual(52),
    borderRadius: scaleVisual(26),
    paddingHorizontal: scaleVisual(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[500],
  },
  bellBadgeText: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
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
    color: colors.text.secondary,
    textAlign: 'left',
  },
  title: {
    ...typography.title.title1,
    fontSize: scaleType(30),
    lineHeight: scaleType(38),
    fontFamily: fonts.heavy,
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
    fontSize: scaleType(30),
    lineHeight: scaleType(38),
    fontFamily: fonts.heavy,
    color: colors.text.primary,
    textAlign: 'center',
  },
  benefitsStepContainer: {
    flexGrow: 1,
    gap: spacing.md,
  },
  benefitsArtWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  benefitsList: {
    alignSelf: 'stretch',
    gap: spacing.mdPlus,
    paddingHorizontal: spacing.sm,
  },
  benefitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitsIcon: {
    width: scaleControl(44),
    height: scaleControl(44),
    borderRadius: scaleControl(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitsRating: {
    alignItems: 'center',
    alignSelf: 'center',
    width: scaleControl(252),
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  benefitsStars: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  benefitsReassurance: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  benefitsTitle: {
    ...typography.heading.heading2,
    flex: 1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  stepTitleBrand: {
    fontFamily: fonts.heavy,
    color: colors.primary.blue500,
  },
  sectionTitle: {
    ...typography.heading.heading1,
    fontFamily: fonts.heavy,
    color: colors.text.primary,
    textAlign: 'center',
  },
  trialNote: {
    ...typography.caption.caption1,
    fontFamily: fonts.semibold,
    color: colors.primary.blue500,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  trialNoteDark: {
    color: colors.primary.blue500,
    textAlign: 'left',
  },
  // Tight vertically on purpose: this block sits above the reminder toggle and
  // the plan cards on the final step, so every point it holds here is a point
  // pushed off the bottom of the screen.
  timeline: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    // The rail spans the padding box, so these are what let it run on above the
    // first icon and past the last block rather than stopping level with them.
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  // The long-form page already supplies the shared horizontal gutter. Removing
  // this deck-only inset keeps the rail aligned with the rest of that page.
  timelineSection: {
    paddingHorizontal: 0,
  },
  // Each row owns its solid rail segment so wrapped copy determines the rail's
  // height without layout measurement. Non-final segments bridge the row gap.
  timelineRailSegment: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: TIMELINE_RAIL_WIDTH,
    borderCurve: 'continuous',
    backgroundColor: colors.primary.blue400,
  },
  timelineRailSegmentFirst: {
    top: -spacing.sm,
    borderTopLeftRadius: TIMELINE_RAIL_WIDTH / 2,
    borderTopRightRadius: TIMELINE_RAIL_WIDTH / 2,
  },
  timelineRailSegmentBridge: {
    bottom: -spacing.sm,
  },
  timelineRailSegmentLast: {
    bottom: -spacing.sm,
    borderBottomLeftRadius: TIMELINE_RAIL_WIDTH / 2,
    borderBottomRightRadius: TIMELINE_RAIL_WIDTH / 2,
  },
  timelineRailCap: {
    height:
      typography.heading.heading1.lineHeight / 2 + TIMELINE_RAIL_WIDTH / 2,
    borderBottomLeftRadius: TIMELINE_RAIL_WIDTH / 2,
    borderBottomRightRadius: TIMELINE_RAIL_WIDTH / 2,
  },
  timelineRailTail: {
    position: 'absolute',
    left: 0,
    top: typography.heading.heading1.lineHeight / 2,
    bottom: -spacing.sm,
    width: TIMELINE_RAIL_WIDTH,
  },
  timelineRow: {
    position: 'relative',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
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
    fontSize: scaleType(20),
    lineHeight: scaleType(26),
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  timelineBody: {
    ...typography.body.medium,
    lineHeight: TIMELINE_BODY_LINE_HEIGHT,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  trialDesignHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  trialDesignTitle: {
    ...typography.title.title1,
    fontSize: scaleType(30),
    lineHeight: scaleType(38),
    fontFamily: fonts.heavy,
    color: colors.text.primary,
    textAlign: 'center',
  },
  timelineStep: {
    marginTop: 0,
    paddingHorizontal: spacing.xs,
    paddingTop: 0,
    paddingBottom: 0,
  },
  timelineStepRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    position: 'relative',
  },
  timelineStepRowLast: {
    paddingBottom: 0,
  },
  timelineStepRail: {
    position: 'absolute',
    left: scaleControl(17),
    top: scaleControl(20),
    bottom: -scaleControl(20),
    width: scaleControl(6),
    borderRadius: scaleControl(3),
    backgroundColor: colors.primary.blue200,
  },
  timelineStepIcon: {
    width: scaleControl(40),
    height: scaleControl(40),
    flexShrink: 0,
    borderRadius: scaleControl(20),
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineStepIconFirst: {
    backgroundColor: colors.primary.blue500,
  },
  timelineStepCopy: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  timelineStepLabel: {
    ...typography.heading.heading1,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  timelineStepBody: {
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
    backgroundColor: colors.background.card,
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
    color: colors.text.primary,
  },
  testimonialTitle: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
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
    width: scaleControl(42),
    height: scaleControl(42),
    borderRadius: scaleControl(42) / 2,
    backgroundColor: colors.neutral[200],
  },
  testimonialAuthor: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  cardsLoading: {
    minHeight: scaleControl(180),
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
  planCardsStacked: {
    gap: spacing.sm,
  },
  // Equal shares and no offset: the two plans are being compared, so neither
  // is given more width or a different baseline than the other.
  annualCard: {
    flex: 1,
  },
  weeklyCard: {
    flex: 1,
  },
  planCardsNoTrial: {
    marginTop: spacing.lg,
  },
});
