import { useEffect, useRef } from 'react';
import {
  Animated,
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

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

      {/* ── Greeting zone (centered, animated) ── */}
      <Animated.View
        style={[
          styles.greetingZone,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>

      {/* ── Daily CTA with gradient accent ── */}
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
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['2xl'],
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
