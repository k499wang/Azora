import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import Pill from '../components/Pill';
import AnalyticsSection from '../components/AnalyticsSection';
import DailyScoresSection from '../components/DailyScoresSection';

const USER_NAME = 'Kevin';
const DAILY_STREAK = 7;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={[styles.screen, { paddingTop: insets.top }]} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome to Brthe</Text>
            <Text style={styles.name}>Hi, {USER_NAME}!</Text>
          </View>
          <Pill icon="fire" label={String(DAILY_STREAK)} />
        </View>
      </View>
      <View style={styles.cta}>
        <Pressable style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]} onPress={() => {}}>
          <View style={styles.ctaButtonContent}>
            <View style={styles.ctaCopy}>
              <Text style={styles.ctaButtonTitle}>Daily exercise</Text>
              <Text style={styles.ctaButtonSubtitle}>
                Start your breath hold exercise.
              </Text>
            </View>
            <View style={styles.ctaVisual}>
              <MaterialCommunityIcons name="chevron-right" size={30} color={colors.text.inverse} />
            </View>
          </View>
        </Pressable>
      </View>
      <DailyScoresSection />
      <AnalyticsSection />
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
  header: {
    paddingHorizontal: padding.screen.horizontal,
    paddingTop: padding.screen.vertical,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    ...typography.body.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.title.title1,
    color: colors.text.primary,
  },
  cta: {
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  ctaButton: {
    width: '100%',
    backgroundColor: colors.primary.blue600,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.primary.blue700,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
    overflow: 'hidden',
  },
  ctaButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  ctaButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  ctaCopy: {
    flex: 1,
    gap: 2,
  },
  ctaButtonTitle: {
    ...typography.title.title3,
    color: colors.text.inverse,
  },
  ctaButtonSubtitle: {
    ...typography.body.xsmall,
    color: colors.primary.blue100,
    maxWidth: 240,
    lineHeight: 18,
  },
  ctaVisual: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
