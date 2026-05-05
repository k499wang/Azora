import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { card } from '../../../theme/card';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import { isHapticsEnabled } from '../../../services/preferences/hapticsPreference';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import CelebrationOverlay from '../CelebrationOverlay';

interface PactScreenProps {
  intentTitle: string;
  displayName: string | null;
  dailyMinutes: number;
  stepIndex: number;
  stepCount: number;
  isSubmitting: boolean;
  errorMessage: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

interface Point {
  x: number;
  y: number;
}

const PAD_WIDTH = 320;
const PAD_HEIGHT = 140;

function buildSmoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    // Simple line for responsiveness; could use quadratic bezier for smoother curves
    d += ` L ${p1.x} ${p1.y}`;
  }
  return d;
}

export default function PactScreen({
  intentTitle,
  displayName,
  dailyMinutes,
  stepIndex,
  stepCount,
  isSubmitting,
  errorMessage,
  onConfirm,
  onBack,
}: PactScreenProps) {
  const [celebrating, setCelebrating] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;
  const inkOpacity = useRef(new Animated.Value(0)).current;
  const padRef = useRef<View>(null);
  const padOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isHapticsEnabled()) {
      Haptics.selectionAsync().catch(() => {});
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (errorMessage) setCelebrating(false);
  }, [errorMessage]);

  const measurePad = useCallback(() => {
    padRef.current?.measureInWindow((x, y) => {
      padOffset.current = { x, y };
    });
  }, []);

  const addPoint = useCallback(
    (evt: GestureResponderEvent) => {
      const { pageX, pageY } = evt.nativeEvent;
      const x = pageX - padOffset.current.x;
      const y = pageY - padOffset.current.y;
      setCurrentStroke((prev) => [...prev, { x, y }]);
    },
    [],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        measurePad();
        setCurrentStroke([]);
        addPoint(evt);
      },
      onPanResponderMove: (evt) => {
        addPoint(evt);
      },
      onPanResponderRelease: () => {
        setStrokes((prev) => {
          const next = [...prev, currentStroke];
          if (next.length > 0 && !hasSigned) {
            setHasSigned(true);
            Animated.timing(inkOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }).start();
            if (isHapticsEnabled()) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              ).catch(() => {});
            }
          }
          return next;
        });
        setCurrentStroke([]);
      },
    }),
  ).current;

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setHasSigned(false);
    inkOpacity.setValue(0);
    if (isHapticsEnabled()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const handleConfirm = () => {
    if (celebrating || isSubmitting || !hasSigned) return;
    setCelebrating(true);
    onConfirm();
  };

  const allPaths = [...strokes, currentStroke].filter((s) => s.length > 0);
  const svgPaths = allPaths.map(buildSmoothPath).filter(Boolean);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <OnboardingScreenLayout
        title="Your daily pact"
        subtitle="Sign to seal your commitment."
        progress={stepIndex / stepCount}
        onBack={onBack}
        footer={
          <Animated.View
            style={[
              styles.footerWrap,
              { opacity: inkOpacity },
            ]}
          >
            <OnboardingPrimaryButton
              label="Sign & commit"
              onPress={handleConfirm}
              loading={isSubmitting && !celebrating}
              disabled={!hasSigned || celebrating}
            />
          </Animated.View>
        }
      >
        <Animated.View
          style={[
            styles.contractWrap,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Contract Paper */}
          <View style={styles.paper}>
            {/* Watermark */}
            <View style={styles.watermark} pointerEvents="none">
              <Text style={styles.watermarkText}>AZORA</Text>
            </View>

            {/* Header */}
            <View style={styles.paperHeader}>
              <View style={styles.seal}>
                <Text style={styles.sealText}>AZORA</Text>
                <View style={styles.sealDot} />
              </View>
              <View style={styles.headerLine} />
              <Text style={styles.docType}>DAILY COMMITMENT</Text>
            </View>

            {/* Body */}
            <View style={styles.paperBody}>
              <Text style={styles.salutation}>
                I,{' '}
                <Text style={styles.nameHighlight}>
                  {displayName || 'the undersigned'}
                </Text>
                , hereby commit to:
              </Text>

              <View style={styles.clauses}>
                <View style={styles.clause}>
                  <View style={styles.clauseNum}>
                    <Text style={styles.clauseNumText}>1</Text>
                  </View>
                  <Text style={styles.clauseText}>
                    Practice breathing exercises for{' '}
                    <Text style={styles.clauseStrong}>{dailyMinutes} minutes</Text>{' '}
                    every day.
                  </Text>
                </View>

                <View style={styles.clause}>
                  <View style={styles.clauseNum}>
                    <Text style={styles.clauseNumText}>2</Text>
                  </View>
                  <Text style={styles.clauseText}>
                    Focus on{' '}
                    <Text style={styles.clauseStrong}>
                      {intentTitle.toLowerCase()}
                    </Text>
                    .
                  </Text>
                </View>

                <View style={styles.clause}>
                  <View style={styles.clauseNum}>
                    <Text style={styles.clauseNumText}>3</Text>
                  </View>
                  <Text style={styles.clauseText}>
                    Show up consistently — progress over perfection.
                  </Text>
                </View>
              </View>

              {/* Signature Pad */}
              <View style={styles.sigSection}>
                <Text style={styles.sigLabel}>
                  {hasSigned ? 'Signed' : 'Sign below'}
                </Text>

                <View
                  ref={padRef}
                  style={styles.sigPad}
                  onLayout={measurePad}
                  {...panResponder.panHandlers}
                >
                  {/* Dotted guide lines */}
                  <View style={styles.guideLine} pointerEvents="none" />
                  <View style={[styles.guideLine, { top: PAD_HEIGHT * 0.33 }]} pointerEvents="none" />
                  <View style={[styles.guideLine, { top: PAD_HEIGHT * 0.66 }]} pointerEvents="none" />

                  {/* SVG Ink */}
                  <Svg
                    width={PAD_WIDTH}
                    height={PAD_HEIGHT}
                    viewBox={`0 0 ${PAD_WIDTH} ${PAD_HEIGHT}`}
                    style={styles.inkLayer}
                  >
                    {svgPaths.map((d, i) => (
                      <Path
                        key={i}
                        d={d}
                        fill="none"
                        stroke={colors.primary.blue700}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                  </Svg>

                  {/* Placeholder hint */}
                  {!hasSigned && svgPaths.length === 0 && (
                    <View style={styles.sigHint} pointerEvents="none">
                      <Text style={styles.sigHintText}>
                        {displayName || 'Your signature'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.sigFooter}>
                  <Text style={styles.sigDate}>{today}</Text>
                  {hasSigned && (
                    <Text style={styles.clearBtn} onPress={handleClear}>
                      Clear
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {errorMessage ? (
          <Text style={styles.error}>{errorMessage}</Text>
        ) : null}
      </OnboardingScreenLayout>

      {celebrating ? <CelebrationOverlay /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  contractWrap: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },

  // Paper
  paper: {
    ...card.base,
    ...card.shadow,
    width: '100%',
    borderRadius: 16,
    backgroundColor: colors.background.elevated,
    overflow: 'hidden',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    opacity: 0.04,
  },
  watermarkText: {
    fontFamily: fonts.bold,
    fontWeight: '700',
    fontSize: 80,
    letterSpacing: 8,
    color: colors.primary.blue700,
  },

  // Header
  paperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.subtle,
  },
  seal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.orange[500],
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sealText: {
    fontFamily: fonts.bold,
    fontWeight: '700',
    fontSize: 8,
    letterSpacing: 0.5,
    color: colors.orange[500],
  },
  sealDot: {
    position: 'absolute',
    bottom: 4,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.orange[500],
  },
  headerLine: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.subtle,
  },
  docType: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.text.tertiary,
  },

  // Body
  paperBody: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  salutation: {
    ...typography.body.medium,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  nameHighlight: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },

  // Clauses
  clauses: {
    gap: spacing.md,
  },
  clause: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  clauseNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary.blue100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  clauseNumText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 12,
    color: colors.primary.blue700,
  },
  clauseText: {
    ...typography.body.medium,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 24,
  },
  clauseStrong: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.text.primary,
  },

  // Signature Section
  sigSection: {
    gap: spacing.sm,
  },
  sigLabel: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: colors.text.tertiary,
  },
  sigPad: {
    width: PAD_WIDTH,
    height: PAD_HEIGHT,
    alignSelf: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    overflow: 'hidden',
    position: 'relative',
  },
  guideLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: PAD_HEIGHT * 0.33,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.subtle,
    opacity: 0.5,
  },
  inkLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sigHint: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sigHintText: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 18,
    color: colors.text.tertiary,
    opacity: 0.35,
    fontStyle: 'italic',
  },
  sigFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  sigDate: {
    ...typography.caption.caption2,
    color: colors.text.tertiary,
  },
  clearBtn: {
    ...typography.caption.caption2,
    fontFamily: fonts.semibold,
    fontWeight: '600',
    color: colors.primary.blue600,
  },

  // Footer
  footerWrap: {
    opacity: 0,
  },

  error: {
    ...typography.body.small,
    color: colors.error[700],
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
