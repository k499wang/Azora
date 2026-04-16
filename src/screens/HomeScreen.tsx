import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import Pill from '../components/common/Pill';
import WeekCalendar from '../components/home/WeekCalendar';
import DailyExerciseButton from '../components/home/DailyExerciseButton';
import DailyScoresSection from '../components/home/DailyScoresSection';
import HighlightCards from '../components/home/HighlightCards';
import AnalyticsSection from '../components/analytics/AnalyticsSection';

const USER_NAME = 'Kevin';
const DAILY_STREAK = 7;

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
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Pill icon="fire" label={String(DAILY_STREAK)} />
        <Text style={styles.brandTitle}>Brthe</Text>
        <Pressable style={styles.gearButton}>
          <MaterialCommunityIcons
            name="cog-outline"
            size={22}
            color={colors.text.secondary}
          />
        </Pressable>
      </View>

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

      <DailyScoresSection />
      <AnalyticsSection />
      <HighlightCards />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    paddingBottom: spacing['5xl'],
  },

  /* ── Top bar ── */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.md,
  },
  brandTitle: {
    ...typography.title.title2,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  gearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Greeting ── */
  greetingZone: {
    alignItems: 'center',
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
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
    marginTop: spacing.sm,
  },

});
