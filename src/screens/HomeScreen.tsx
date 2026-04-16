import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, padding } from '../theme/spacing';
import AppTopBar from '../components/common/AppTopBar';
import WeekCalendar from '../components/home/WeekCalendar';
import DailyExerciseButton from '../components/home/DailyExerciseButton';
import DailyScoresSection from '../components/home/DailyScoresSection';
import { LinearGradient } from 'expo-linear-gradient';

const USER_NAME = 'Kevin';
const DAILY_STREAK = 1;

function getGreeting(): { greeting: string; subtitle: string } {
  const hour = new Date().getHours();

  if (hour < 5) {
    return {
      greeting: `Late night, ${USER_NAME}`,
      subtitle: 'A few deep breaths before rest can work wonders.',
    };
  }
  if (hour < 12) {
    return {
      greeting: `Good morning, ${USER_NAME}`,
      subtitle: 'Start your day with a calm, focused mind.',
    };
  }
  if (hour < 17) {
    return {
      greeting: `Good afternoon, ${USER_NAME}`,
      subtitle: 'Take a moment to reset and recharge.',
    };
  }
  if (hour < 21) {
    return {
      greeting: `Good evening, ${USER_NAME}`,
      subtitle: 'Wind down and let the tension go.',
    };
  }
  return {
    greeting: `Good night, ${USER_NAME}`,
    subtitle: 'A few deep breaths before rest can work wonders.',
  };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { greeting, subtitle } = getGreeting();

  const greetingFade = useRef(new Animated.Value(0)).current;
  const greetingSlide = useRef(new Animated.Value(12)).current;
  const subtitleFade = useRef(new Animated.Value(0)).current;
  const subtitleSlide = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.stagger(300, [
      Animated.parallel([
        Animated.timing(greetingFade, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(greetingSlide, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(subtitleFade, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleSlide, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [greetingFade, greetingSlide, subtitleFade, subtitleSlide]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#F0E6F6', '#E8EEF8', colors.background.primary]}
        locations={[0, 0.4, 0.75]}
        style={StyleSheet.absoluteFill}
      />
      {/* ── Top bar (sticky) ── */}
      <AppTopBar streak={DAILY_STREAK} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* ── Week calendar ── */}
      <WeekCalendar />

      {/* ── Greeting zone (typing animation) ── */}
      <View style={styles.greetingZone}>
        <Animated.Text
          style={[
            styles.greeting,
            { opacity: greetingFade, transform: [{ translateY: greetingSlide }] },
          ]}
        >
          {greeting}
        </Animated.Text>
        <Animated.Text
          style={[
            styles.subtitle,
            { opacity: subtitleFade, transform: [{ translateY: subtitleSlide }] },
          ]}
        >
          {subtitle}
        </Animated.Text>
      </View>

      <View style={styles.cta}>
        <DailyExerciseButton
          onPress={() => navigation.navigate('DailyExercise')}
        />
      </View>

      <View style={styles.scoresContainer}>
        <DailyScoresSection />
      </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['5xl'],
  },
  /* ── Greeting ── */
  greetingZone: {
    alignItems: 'center',
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.md,
  },
  greeting: {
    ...typography.title.title1,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
    lineHeight: 24,
  },

  /* ── CTA ── */
  cta: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: spacing.md,
  },
  scoresContainer: {
    marginTop: -spacing.md,
  },
});
