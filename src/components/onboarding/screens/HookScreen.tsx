import { AnimatedText } from '../../common/Text';
import { useEffect, useRef, type ReactElement } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// Keep a generous stage around the capsule so the larger shape still has room
// to draw cleanly without crowding the heading below it.
const STAGE_WIDTH = 230;
const STAGE_HEIGHT = 138;

const CAPSULE_CENTER_X = 50;
const CAPSULE_TOP = 28;
const CAPSULE_BOTTOM = 54;
const SEAM_X = CAPSULE_CENTER_X;

const CAPSULE_PATH =
  'M28 28 H72 A13 13 0 0 1 72 54 H28 A13 13 0 0 1 28 28 Z';
// Left half closed across the seam. An explicit path rather than a clipped rect
// so the fill doesn't depend on clip-path support to show up at all.
const CAPSULE_LEFT_HALF_PATH = 'M50.5 28 H28 A13 13 0 0 0 28 54 H50.5 Z';
const CAPSULE_LENGTH = 172;
const CAPSULE_DRAW_MS = 700;
const CAPSULE_DRAW_DELAY_MS = 80;

// Strokes itself in once on arrival, then holds. One-shot on purpose — a loop
// would keep pulling focus off copy the user is still reading.
function Capsule() {
  const draw = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // JS-driven: strokeDashoffset isn't a native-driver-able prop.
    const animation = Animated.timing(draw, {
      toValue: 1,
      duration: CAPSULE_DRAW_MS,
      delay: CAPSULE_DRAW_DELAY_MS,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [draw]);

  const dashOffset = draw.interpolate({
    inputRange: [0, 1],
    outputRange: [CAPSULE_LENGTH, 0],
  });
  const seamDashOffset = draw.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [CAPSULE_BOTTOM - CAPSULE_TOP, CAPSULE_BOTTOM - CAPSULE_TOP, 0],
  });

  return (
    <Svg width={STAGE_WIDTH} height={STAGE_HEIGHT} viewBox="0 0 100 60">
      <Path d={CAPSULE_PATH} fill={colors.background.elevated} />
      <Path d={CAPSULE_LEFT_HALF_PATH} fill={colors.primary.blue600} />

      <AnimatedPath
        d={CAPSULE_PATH}
        stroke={colors.primary.blue700}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={[CAPSULE_LENGTH, CAPSULE_LENGTH]}
        strokeDashoffset={dashOffset}
        fill="none"
      />
      <AnimatedLine
        x1={SEAM_X}
        y1={CAPSULE_TOP}
        x2={SEAM_X}
        y2={CAPSULE_BOTTOM}
        stroke={colors.primary.blue700}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={[
          CAPSULE_BOTTOM - CAPSULE_TOP,
          CAPSULE_BOTTOM - CAPSULE_TOP,
        ]}
        strokeDashoffset={seamDashOffset}
      />
    </Svg>
  );
}

function BreathLines() {
  return (
    <Svg
      width={STAGE_WIDTH}
      height={STAGE_HEIGHT}
      viewBox="0 0 100 60"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path
        d="M18.5 54 C19.8 49.4 22.7 44.1 20.5 38.6 C18 33.7 16.1 28.2 16.8 22.8 C17.9 13 25.8 5.4 35.8 5.2 C46.2 5 53.9 12.4 54 22 C54 26.1 54.9 28.2 57 30.1 C58.1 31.1 58 32.2 57 32.9 C56.2 33.4 55.1 33.8 54 34.1 C55.2 34.6 56 35.2 56 35.9 C56 36.6 55.2 37.1 54.1 37.3 C55 37.7 55.4 38.3 55 38.9 C54.6 39.6 53.7 39.8 52.8 40 C54 40.6 54.4 41.4 54 42.1 C53.1 43.6 51 44.4 48.8 44.2 C47.2 44 45.9 43.2 44.8 42.2 C44.9 46.7 44.6 50.5 42.5 54.5"
        fill="none"
        stroke={colors.primary.blue700}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M61.5 29.5 H78.5 C82.6 29.5 84.7 27.4 84.7 24.9 C84.7 22.7 83 21.2 80.9 21.2 C79.2 21.2 78 22.2 77.5 23.7"
        fill="none"
        stroke={colors.primary.blue700}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M60.5 35.8 H90 C94 35.8 96.2 33.7 96.2 31.1 C96.2 28.9 94.5 27.4 92.4 27.4 C90.7 27.4 89.5 28.4 89 29.9"
        fill="none"
        stroke={colors.primary.blue700}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M61.8 42 H81 C85 42 87.2 44.1 87.2 46.7 C87.2 48.9 85.5 50.4 83.4 50.4 C81.7 50.4 80.5 49.4 80 47.9"
        fill="none"
        stroke={colors.primary.blue700}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// A phone held up with a heart reading on it — built like the capsule: a filled
// body, a heavy outline, one solid accent shape. The pulse is the only thing
// that moves, so it reads as a live measurement rather than a diagram.
const PHONE_PATH =
  'M40 5 H60 A6 6 0 0 1 66 11 V49 A6 6 0 0 1 60 55 H40 A6 6 0 0 1 34 49 V11 A6 6 0 0 1 40 5 Z';
const HEART_PATH =
  'M50 30 C45 25.6 41 23.1 41 19.3 C41 16.5 43.1 14.9 45.5 14.9 C47.3 14.9 48.9 15.9 50 17.4 C51.1 15.9 52.7 14.9 54.5 14.9 C56.9 14.9 59 16.5 59 19.3 C59 23.1 55 25.6 50 30 Z';
const PULSE_PATH = 'M39 40 H44 L46.5 34 L49 46 L51.5 37 L54 40 H61';
const PULSE_LENGTH = 60;
const PULSE_SWEEP_MS = 2400;

function PulseReading() {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: PULSE_SWEEP_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
      { resetBeforeIteration: true },
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const dashOffset = sweep.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [PULSE_LENGTH, 0, -PULSE_LENGTH],
  });

  return (
    <Svg
      width={STAGE_WIDTH}
      height={STAGE_HEIGHT}
      viewBox="0 0 100 60"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path d={PHONE_PATH} fill={colors.background.elevated} />
      <Path
        d={PHONE_PATH}
        fill="none"
        stroke={colors.primary.blue700}
        strokeWidth={2.5}
      />
      <Line
        x1={45}
        y1={9.5}
        x2={55}
        y2={9.5}
        stroke={colors.primary.blue700}
        strokeWidth={2}
        strokeLinecap="round"
      />

      <Path d={HEART_PATH} fill={colors.primary.blue600} />

      <Path
        d={PULSE_PATH}
        stroke={colors.primary.blue100}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <AnimatedPath
        d={PULSE_PATH}
        stroke={colors.primary.blue600}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[PULSE_LENGTH, PULSE_LENGTH]}
        strokeDashoffset={dashOffset}
        fill="none"
      />
    </Svg>
  );
}

// A profile card filling itself in: two answered rows already set, the third
// still being drawn. Same construction as the other visuals — filled body,
// heavy outline, one solid accent.
const CARD_PATH =
  'M27 5 H73 A7 7 0 0 1 80 12 V48 A7 7 0 0 1 73 55 H27 A7 7 0 0 1 20 48 V12 A7 7 0 0 1 27 5 Z';
const CARD_ROW_Y = [17, 27, 37, 47];
const CARD_ROW_X = 29;
const CARD_ROW_WIDTH = 42;
const CARD_ROW_WIDTH_LAST = 28;
const CARD_ROW_DRAW_MS = 520;
const CARD_ROW_STAGGER_MS = 260;

// Last row runs short so the card reads as still being filled in.
const rowWidth = (index: number) =>
  index === CARD_ROW_Y.length - 1 ? CARD_ROW_WIDTH_LAST : CARD_ROW_WIDTH;

function ProfileCard() {
  const rows = useRef(CARD_ROW_Y.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animation = Animated.stagger(
      CARD_ROW_STAGGER_MS,
      rows.map((row) =>
        Animated.timing(row, {
          toValue: 1,
          duration: CARD_ROW_DRAW_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ),
    );
    animation.start();
    return () => animation.stop();
  }, [rows]);

  return (
    <Svg
      width={STAGE_WIDTH}
      height={STAGE_HEIGHT}
      viewBox="0 0 100 60"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path d={CARD_PATH} fill={colors.background.elevated} />
      <Path
        d={CARD_PATH}
        fill="none"
        stroke={colors.primary.blue700}
        strokeWidth={2.5}
      />

      {CARD_ROW_Y.map((y, index) => {
        const width = rowWidth(index);
        return (
          <Line
            key={`track-${y}`}
            x1={CARD_ROW_X}
            y1={y}
            x2={CARD_ROW_X + width}
            y2={y}
            stroke={colors.primary.blue100}
            strokeWidth={4}
            strokeLinecap="round"
          />
        );
      })}

      {CARD_ROW_Y.map((y, index) => {
        const width = rowWidth(index);
        return (
          <AnimatedLine
            key={`row-${y}`}
            x1={CARD_ROW_X}
            y1={y}
            x2={CARD_ROW_X + width}
            y2={y}
            stroke={colors.primary.blue600}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={[width, width]}
            strokeDashoffset={rows[index].interpolate({
              inputRange: [0, 1],
              outputRange: [width, 0],
            })}
          />
        );
      })}
    </Svg>
  );
}

const BENEFIT_STAGGER_MS = 200;

function BenefitList({ items }: { items: string[] }) {
  const entries = useRef(items.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animation = Animated.stagger(
      BENEFIT_STAGGER_MS,
      entries.map((entry) =>
        Animated.timing(entry, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    );
    animation.start();
    return () => animation.stop();
  }, [entries]);

  return (
    <View style={styles.benefitList}>
      {items.map((item, index) => (
        <Animated.View
          key={item}
          style={{
            opacity: entries[index],
            transform: [
              {
                translateY: entries[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          <AnimatedText style={styles.benefitItem}>{item}</AnimatedText>
        </Animated.View>
      ))}
    </View>
  );
}

export type HookBeat =
  | 'setup'
  | 'benefits'
  | 'reveal'
  | 'camera'
  | 'profile';

interface HookBeatContent {
  Visual?: () => ReactElement;
  headingLead?: string;
  headingAccent?: string;
  items?: string[];
  subtitle?: string;
  ctaLabel: string;
}

// The beats are deliberately one unfinished sentence: each trails off so the tap
// is driven by the open clause, not by persuasion. The middle beat withholds the
// subject and lets the benefits land on their own.
const BEATS: Record<HookBeat, HookBeatContent> = {
  setup: {
    Visual: Capsule,
    headingLead: 'Imagine I told you there was a drug that ',
    headingAccent: 'gave you…',
    subtitle: 'Stay with me for ten seconds.',
    ctaLabel: 'Next',
  },
  benefits: {
    items: [
      'Calm in seconds',
      'Better and deeper sleep',
      'Sharper focus for longer',
      'Improved overall wellbeing',
      'A quick reset anytime',
      'Better tolerance for anger',
      'A slower resting heart rate',
      'Looser neck and shoulders',
      'More patience with people',
      'No cost. No side effects.',
    ],
    ctaLabel: 'Next',
  },
  reveal: {
    Visual: BreathLines,
    headingLead: 'That drug is the way ',
    headingAccent: 'you breathe.',
    subtitle: 'Decades of nervous-system research back it.',
    ctaLabel: 'Next',
  },
  camera: {
    Visual: PulseReading,
    headingLead: 'Azora reads your heart rate ',
    headingAccent: 'and learns what you need.',
    subtitle:
      'No expensive wearable — we measure it from your phone camera alone.',
    ctaLabel: 'Next',
  },
  // Hands off from the pitch to the questions: says what's about to happen, how
  // long it takes, and what the answers are for.
  profile: {
    Visual: ProfileCard,
    headingLead: "First, let's craft your ",
    headingAccent: 'breathing profile.',
    subtitle:
      'Quick and easy — your answers tailor the guidance you get from here.',
    ctaLabel: 'Craft my profile',
  },
};

interface HookScreenProps {
  beat: HookBeat;
  onContinue: () => void;
}

const ENTRANCE_MS = 620;

function useEntrance(beat: HookBeat, delay: number, distance: number) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    value.setValue(0);
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: ENTRANCE_MS,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [beat, value, delay]);

  return {
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  };
}

export default function HookScreen({ beat, onContinue }: HookScreenProps) {
  const { Visual, headingLead, headingAccent, items, subtitle, ctaLabel } =
    BEATS[beat];

  // Staggered so the screen assembles itself rather than appearing at once.
  const visualEntrance = useEntrance(beat, 0, 14);
  const headingEntrance = useEntrance(beat, 180, 18);
  const subtitleEntrance = useEntrance(beat, 400, 14);
  // On the list beat the button waits for the last item to start moving, so
  // adding or cutting a benefit doesn't leave the CTA landing mid-stagger.
  const ctaEntrance = useEntrance(
    beat,
    items ? (items.length - 1) * BENEFIT_STAGGER_MS + 120 : 600,
    12,
  );

  return (
    <OnboardingScreenLayout
      title=""
      progress={0}
      hideProgress
      fullWidthProgress
      centerBody
      centerOnScreen
      footer={
        <Animated.View style={ctaEntrance}>
          <OnboardingPrimaryButton label={ctaLabel} onPress={onContinue} />
        </Animated.View>
      }
    >
      {/* Only the heading sits in normal flow, so the layout centres the heading
          itself on the screen. The visual and subtitle are anchored to its top
          and bottom edges out of flow — their size can't push the title off
          centre, and a heading that grows from one line to four stays centred
          while they move with it. */}
      <View style={styles.stage}>
        {Visual ? (
          <Animated.View style={[styles.visualAnchor, visualEntrance]}>
            <Visual />
          </Animated.View>
        ) : null}

        {headingLead ? (
          <AnimatedText style={[styles.heading, headingEntrance]}>
            {headingLead}
            <AnimatedText style={styles.headingAccent}>
              {headingAccent}
            </AnimatedText>
          </AnimatedText>
        ) : null}

        {items ? <BenefitList items={items} /> : null}

        {subtitle ? (
          <AnimatedText
            style={[styles.subtitle, styles.subtitleAnchor, subtitleEntrance]}
          >
            {subtitle}
          </AnimatedText>
        ) : null}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  // On top of the layout's own screen padding — the display-size heading needs
  // a wider margin than body copy before the line breaks stop reading as edge
  // collisions.
  stage: {
    paddingHorizontal: spacing.lg,
  },
  visualAnchor: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    height: STAGE_HEIGHT,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleAnchor: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: spacing.xl,
  },
  heading: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: colors.text.primary,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  headingAccent: {
    ...typography.display.display2,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: colors.primary.blue600,
    textAlign: 'center',
  },
  // Inset past the heading's own margin. Centred captions read as crowded well
  // before they actually touch the edge, so this sits nearer the 40–50%
  // line-length guidance than the 16pt platform minimum.
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  benefitList: {
    alignSelf: 'stretch',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  // Sized so the full list clears the body box on a 667pt screen, where there's
  // only ~440pt to play with and the centred body doesn't scroll.
  benefitItem: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
