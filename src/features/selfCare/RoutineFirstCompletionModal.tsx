import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';
import ChunkyButton from '../../components/common/ChunkyButton';
import { Text } from '../../components/common/Text';
import Icon from '../../components/common/icons/Icon';
import { colors } from '../../theme/colors';
import { card, radius } from '../../theme/card';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import {
  isRoutineStreakWeekdayFilled,
  routineStreakTitle,
  ROUTINE_STREAK_WEEK_DAYS,
} from './domain/routineFirstCompletion';

interface Props {
  visible: boolean;
  streakDays: number;
  completedDaysAgo: readonly number[];
  onContinue: () => void;
}

/** A brief celebration for the first routine win of a day. */
export default function RoutineFirstCompletionModal({
  visible,
  streakDays,
  completedDaysAgo,
  onContinue,
}: Props) {
  const [mounted, setMounted] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  const reveal = useRef(new Animated.Value(0)).current;
  const firePop = useRef(new Animated.Value(0.55)).current;
  const todayFirePop = useRef(new Animated.Value(0.45)).current;
  const today = new Date().getDay();

  useEffect(() => {
    if (visible && !mounted) setMounted(true);
  }, [mounted, visible]);

  useEffect(() => {
    if (visible && mounted) {
      setLeaving(false);
      reveal.setValue(0);
      firePop.setValue(0.55);
      todayFirePop.setValue(0.45);
      Animated.parallel([
        Animated.timing(reveal, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(firePop, {
            toValue: 1.16,
            useNativeDriver: true,
            friction: 5,
            tension: 95,
          }),
          Animated.spring(firePop, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
            tension: 85,
          }),
        ]),
        Animated.sequence([
          Animated.delay(220),
          Animated.spring(todayFirePop, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 110,
          }),
        ]),
      ]).start();
    }
  }, [firePop, mounted, reveal, todayFirePop, visible]);

  /** plays the exit, then unmounts; `after` runs once it is off the screen */
  const leave = (after?: () => void) => {
    if (leaving) return;
    setLeaving(true);
    Animated.parallel([
      Animated.timing(reveal, {
        toValue: 0,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(firePop, {
        toValue: 0.78,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setMounted(false);
      after?.();
    });
  };
  const dismiss = () => leave(onContinue);

  // Hidden from outside — its host lost focus, something with a better claim
  // to the screen arrived, or the win it announces was withdrawn. It leaves the
  // same way it would on Continue, without reporting a Continue.
  useEffect(() => {
    if (!visible && mounted) leave();
    // `leave` is rebuilt every render; this watches only the visibility.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, visible]);

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            card.base,
            styles.card,
            {
              opacity: reveal,
              transform: [
                { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }) },
                { scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
              ],
            },
          ]}
          accessibilityViewIsModal
        >
          <Animated.View style={[styles.fireHero, { transform: [{ scale: firePop }] }]}>
            <Icon name="streakFilled" size={136} color={colors.orange[500]} />
          </Animated.View>
          <Text style={styles.title}>{routineStreakTitle(streakDays)}</Text>
          <View style={styles.week}>
            {ROUTINE_STREAK_WEEK_DAYS.map((day, index) => {
              const filled = isRoutineStreakWeekdayFilled(index, today, completedDaysAgo);
              return (
                <View key={day} style={styles.weekDay}>
                  <Text style={styles.weekLabel}>{day}</Text>
                  {index === today ? (
                    <Animated.View style={{ transform: [{ scale: todayFirePop }] }}>
                      <Icon
                        name="streakFilled"
                        size={30}
                        color={filled ? colors.orange[500] : colors.border.subtle}
                      />
                    </Animated.View>
                  ) : (
                    <Icon
                      name="streakFilled"
                      size={30}
                      color={filled ? colors.orange[500] : colors.border.subtle}
                    />
                  )}
                </View>
              );
            })}
          </View>
          <ChunkyButton label="Continue" onPress={dismiss} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(20, 24, 38, 0.58)' },
  card: { width: '100%', maxWidth: 460, alignItems: 'center', gap: spacing.lg, padding: spacing.xl, borderRadius: radius.sheet },
  fireHero: { width: 148, height: 142, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.title.title1, fontFamily: fonts.semibold, color: colors.text.primary },
  week: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.xl, backgroundColor: colors.background.cardSoft },
  weekDay: { alignItems: 'center', gap: spacing.xs },
  weekLabel: { ...typography.label.detail, color: colors.text.secondary },
});
