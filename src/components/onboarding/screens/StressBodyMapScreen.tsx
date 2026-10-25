import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { triggerTapHaptic } from '../../../native/tapHaptics';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { Text } from '../../common/Text';
import AzoAside from '../AzoAside';
import type { StressSignalId } from '../data/routineOptions';
import { entranceTiming } from '../entranceTiming';
import OnboardingFooterNotice from '../OnboardingFooterNotice';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import OnboardingScreenLayout from '../OnboardingScreenLayout';

export type StressBodyPartId = 'head' | 'shoulders' | 'chest' | 'stomach' | 'hands' | 'legs';

interface BodyPart {
  id: StressBodyPartId;
  label: string;
  caption: string;
  /** the stress answer this spot stands for, so scores read it as the list did */
  signal: StressSignalId;
  points: { x: number; y: number }[];
}

const BODY_PARTS: BodyPart[] = [
  {
    id: 'head',
    label: 'Head',
    caption: 'My thoughts race through everything I need to do',
    signal: 'worryLoop',
    points: [{ x: 100, y: 38 }],
  },
  {
    id: 'shoulders',
    label: 'Neck and shoulders',
    caption: 'My neck and shoulders tighten up',
    signal: 'bodyAlarm',
    points: [{ x: 66, y: 96 }, { x: 134, y: 96 }],
  },
  {
    id: 'chest',
    label: 'Chest',
    caption: 'My chest gets tight or my breathing speeds up',
    signal: 'bodyAlarm',
    points: [{ x: 100, y: 128 }],
  },
  {
    id: 'stomach',
    label: 'Stomach',
    caption: 'My stomach knots up',
    signal: 'bodyAlarm',
    points: [{ x: 100, y: 172 }],
  },
  {
    id: 'hands',
    label: 'Hands',
    caption: 'I get restless and jump between tasks',
    signal: 'scatteredFocus',
    points: [{ x: 21, y: 214 }, { x: 179, y: 214 }],
  },
  {
    id: 'legs',
    label: 'Legs',
    caption: 'I feel heavy and can’t get started',
    signal: 'frozen',
    points: [{ x: 81, y: 262 }, { x: 119, y: 262 }],
  },
];

const FIGURE_WIDTH = 200;
const FIGURE_HEIGHT = 330;
/** the share of the screen's height the figure fills */
const FIGURE_HEIGHT_SHARE = 0.52;
const HIT_RADIUS = 22;
const DOT_RADIUS = 7;
const HALO_RADIUS = 15;
const DOT_STROKE = 2;

const SILHOUETTE = colors.neutral[200];
const ACCENT = colors.playful.sky;

interface StressBodyMapScreenProps {
  value: StressSignalId | null;
  stepIndex: number;
  stepCount: number;
  onSelect: (id: StressSignalId) => void;
  onContinue: (part: StressBodyPartId | null) => void;
  onBack: () => void;
  onSkip: () => void;
}

export default function StressBodyMapScreen({
  value,
  stepIndex,
  stepCount,
  onSelect,
  onContinue,
  onBack,
  onSkip,
}: StressBodyMapScreenProps) {
  const [partId, setPartId] = useState<StressBodyPartId | null>(
    () => BODY_PARTS.find((part) => part.signal === value)?.id ?? null,
  );
  const selected = BODY_PARTS.find((part) => part.id === partId);
  const figureHeight = useWindowDimensions().height * FIGURE_HEIGHT_SHARE;

  const select = (part: BodyPart) => {
    triggerTapHaptic();
    setPartId(part.id);
    onSelect(part.signal);
  };

  return (
    <OnboardingScreenLayout
      title=""
      titleSlot={
        <AzoAside
          text="Where does stress show up in your body first?"
          variant="question"
          expression="listening"
          wearing="glasses"
          holding="notes"
          delayMs={entranceTiming.promptDelay}
        />
      }
      progress={stepIndex / stepCount}
      contentGap={spacing.xs}
      onBack={onBack}
      onSkip={onSkip}
      footer={
        <View>
          {selected ? (
            <OnboardingFooterNotice key={selected.id}>
              <Text style={styles.label}>{selected.label}</Text>
              <Text style={styles.caption}>{selected.caption}</Text>
            </OnboardingFooterNotice>
          ) : null}
          <OnboardingPrimaryButton
            label="Continue"
            onPress={() => onContinue(partId)}
            disabled={selected == null}
          />
        </View>
      }
    >
      <View style={styles.figure}>
        <Svg
          width={figureHeight * (FIGURE_WIDTH / FIGURE_HEIGHT)}
          height={figureHeight}
          viewBox={`0 0 ${FIGURE_WIDTH} ${FIGURE_HEIGHT}`}
        >
          <Circle cx={100} cy={38} r={26} fill={SILHOUETTE} />
          <Rect x={90} y={60} width={20} height={22} rx={6} fill={SILHOUETTE} />
          <Rect x={30} y={88} width={20} height={124} rx={10} transform="rotate(10 40 92)" fill={SILHOUETTE} />
          <Rect x={150} y={88} width={20} height={124} rx={10} transform="rotate(-10 160 92)" fill={SILHOUETTE} />
          <Circle cx={21} cy={214} r={11} fill={SILHOUETTE} />
          <Circle cx={179} cy={214} r={11} fill={SILHOUETTE} />
          <Rect x={66} y={186} width={30} height={138} rx={14} fill={SILHOUETTE} />
          <Rect x={104} y={186} width={30} height={138} rx={14} fill={SILHOUETTE} />
          <Path
            d="M58 84 Q100 72 142 84 Q152 88 150 104 L140 196 Q100 208 60 196 L50 104 Q48 88 58 84 Z"
            fill={SILHOUETTE}
          />

          {BODY_PARTS.map((part) => {
            const active = part.id === partId;
            return (
              <G key={part.id} onPress={() => select(part)}>
                {part.points.map(({ x, y }) => (
                  <G key={`${x}-${y}`}>
                    <Circle cx={x} cy={y} r={HIT_RADIUS} fill="transparent" />
                    {active ? <Circle cx={x} cy={y} r={HALO_RADIUS} fill={ACCENT.soft} /> : null}
                    <Circle
                      cx={x}
                      cy={y}
                      r={DOT_RADIUS}
                      fill={active ? ACCENT.base : colors.neutral[0]}
                      stroke={active ? ACCENT.base : colors.neutral[400]}
                      strokeWidth={DOT_STROKE}
                    />
                  </G>
                ))}
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Hidden rather than removed, so a tap never shrinks the page and switches its scrolling off. */}
      <Text style={[styles.hint, selected != null && styles.hintHidden]}>Tap the spot you notice first</Text>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  figure: {
    alignItems: 'center',
  },
  label: {
    ...typography.label.medium,
    fontFamily: fonts.heavy,
    color: ACCENT.ink,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  caption: {
    ...typography.body.small,
    color: colors.text.primary,
    textAlign: 'center',
  },
  hint: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  hintHidden: {
    opacity: 0,
  },
});
