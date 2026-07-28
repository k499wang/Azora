import { AnimatedText } from '../../common/Text';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);

const STAGE_WIDTH = 190;
const STAGE_HEIGHT = 114;

const CAPSULE_PATH =
  'M22 16 H78 A14 14 0 0 1 78 44 H22 A14 14 0 0 1 22 16 Z';
// Rounded-rect perimeter: 2×56 straight + 2π×14 for the two end caps.
const CAPSULE_LENGTH = 200;
const CAPSULE_DRAW_MS = 900;

// Strokes itself in once on arrival, then holds. One-shot on purpose — a loop
// would keep pulling focus off copy the user is still reading.
function Capsule() {
  const draw = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // JS-driven: strokeDashoffset isn't a native-driver-able prop.
    const animation = Animated.timing(draw, {
      toValue: 1,
      duration: CAPSULE_DRAW_MS,
      delay: 120,
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
  // Held back until the outline has almost closed, so the seam reads as the
  // last stroke rather than as part of the shape arriving.
  const seamOpacity = draw.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Svg width={STAGE_WIDTH} height={STAGE_HEIGHT} viewBox="0 0 100 60">
      <AnimatedPath
        d={CAPSULE_PATH}
        stroke={colors.primary.blue600}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={[CAPSULE_LENGTH, CAPSULE_LENGTH]}
        strokeDashoffset={dashOffset}
        fill="none"
      />
      <AnimatedLine
        x1={50}
        y1={16}
        x2={50}
        y2={44}
        stroke={colors.primary.blue600}
        strokeWidth={2.5}
        opacity={seamOpacity}
      />
    </Svg>
  );
}

// Jagged on the left, settling into progressively shallower waves — the trace
// reads as the measurement and the calm-down in one stroke.
const TRACE_PATH =
  'M2 30 H10 L13 13 L16 47 L19 16 L22 44 L25 19 L28 41 L31 30 C38 30 38 18 45 18 C52 18 52 42 59 42 C66 42 66 21 72 21 C78 21 78 39 84 39 C89 39 89 27 94 27 C96 27 97 30 98 30';
// Approximate arc length of TRACE_PATH; only needs to exceed the true length so
// the dash pattern fully covers the stroke at both ends of the sweep.
const TRACE_LENGTH = 260;
const TRACE_SWEEP_MS = 3600;

function CalmingTrace() {
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: TRACE_SWEEP_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
      { resetBeforeIteration: true },
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  // Draws in from the left across the first half, then wipes out the same way.
  const dashOffset = sweep.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [TRACE_LENGTH, 0, -TRACE_LENGTH],
  });

  return (
    <Svg width={STAGE_WIDTH} height={STAGE_HEIGHT} viewBox="0 0 100 60">
      <Path
        d={TRACE_PATH}
        stroke={colors.primary.blue100}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <AnimatedPath
        d={TRACE_PATH}
        stroke={colors.primary.blue500}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[TRACE_LENGTH, TRACE_LENGTH]}
        strokeDashoffset={dashOffset}
        fill="none"
      />
    </Svg>
  );
}

const BENEFIT_STAGGER_MS = 320;

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

export type HookBeat = 'setup' | 'benefits' | 'reveal';

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
      'Calm, in about five minutes',
      'A better mood than meditation',
      'Sleep that comes faster',
      'Steadier focus, without caffeine',
      'No cost. No side effects.',
    ],
    ctaLabel: 'Next',
  },
  reveal: {
    Visual: CalmingTrace,
    headingLead: 'That drug is the way ',
    headingAccent: 'you exhale.',
    subtitle: 'Most people feel it on the first one.',
    ctaLabel: 'Show me how',
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

  // The layout's body box isn't centred on the screen — the header is taller
  // than the footer by the top safe-area inset — so centring inside it leaves
  // the title low. Measure the heading itself against the window and shift the
  // whole group by the difference instead of hardcoding the layout's paddings.
  const headingRef = useRef<View>(null);
  const offsetRef = useRef(0);
  const [centerOffset, setCenterOffset] = useState(0);

  const measureHeading = useCallback(() => {
    headingRef.current?.measureInWindow((_x, y, _width, height) => {
      if (height <= 0) return;
      // measureInWindow reports the position with the current shift already
      // applied, so fold it back in to get the correction in one pass.
      const delta = Dimensions.get('window').height / 2 - (y + height / 2);
      if (Math.abs(delta) < 0.5) return;
      const next = offsetRef.current + delta;
      offsetRef.current = next;
      setCenterOffset(next);
    });
  }, []);

  // Staggered so the screen assembles itself rather than appearing at once.
  const visualEntrance = useEntrance(beat, 0, 14);
  const headingEntrance = useEntrance(beat, 180, 18);
  const subtitleEntrance = useEntrance(beat, 400, 14);
  const ctaEntrance = useEntrance(beat, items ? 1400 : 600, 12);

  return (
    <OnboardingScreenLayout
      title=""
      progress={0}
      hideProgress
      fullWidthProgress
      footer={
        <Animated.View style={ctaEntrance}>
          <OnboardingPrimaryButton label={ctaLabel} onPress={onContinue} />
        </Animated.View>
      }
    >
      {/* Three slots with equal flex above and below: the heading sits in the
          middle one and the visual and subtitle hang off it without shifting
          it. The inner view then translates the whole group until the heading's
          centre coincides with the screen's. */}
      <View onLayout={measureHeading} style={styles.stage}>
        <View
          style={[
            styles.stageInner,
            { transform: [{ translateY: centerOffset }] },
          ]}
        >
          <View style={styles.aboveSlot}>
            {Visual ? (
              <Animated.View style={[styles.visual, visualEntrance]}>
                <Visual />
              </Animated.View>
            ) : null}
          </View>

          <View
            ref={headingRef}
            onLayout={measureHeading}
            style={styles.centerSlot}
          >
            {headingLead ? (
              <AnimatedText style={[styles.heading, headingEntrance]}>
                {headingLead}
                <AnimatedText style={styles.headingAccent}>
                  {headingAccent}
                </AnimatedText>
              </AnimatedText>
            ) : null}
            {items ? <BenefitList items={items} /> : null}
          </View>

          <View style={styles.belowSlot}>
            {subtitle ? (
              <AnimatedText style={[styles.subtitle, subtitleEntrance]}>
                {subtitle}
              </AnimatedText>
            ) : null}
          </View>
        </View>
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  stageInner: {
    flex: 1,
  },
  aboveSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
  },
  centerSlot: {
    alignSelf: 'stretch',
    alignItems: 'stretch',
  },
  belowSlot: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  visual: {
    width: STAGE_WIDTH,
    height: STAGE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
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
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  benefitList: {
    gap: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  benefitItem: {
    ...typography.title.title3,
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
