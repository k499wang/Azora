import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChunkyButton from '../../components/common/ChunkyButton';
import CloseButton from '../../components/common/CloseButton';
import ScreenContent from '../../components/common/ScreenContent';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { Text } from '../../components/common/Text';
import type { Lesson } from './domain/lessonCatalogue';
import { lessonEstimatedMinutes } from './domain/lessonDuration';
import { colors } from '../../theme/colors';
import { card, radius } from '../../theme/card';
import { padding, spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface LessonIntroductionProps {
  lesson: Lesson;
  coins: number;
  onStart: () => void;
  onClose: () => void;
}

export default function LessonIntroduction({ lesson, coins, onStart, onClose }: LessonIntroductionProps) {
  const insets = useSafeAreaInsets();
  const learningSummary = lesson.introduction;
  const minutes = lessonEstimatedMinutes(lesson.blocks);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <CloseButton onPress={onClose} />
        <Text style={styles.headerLabel}>A little learning</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenContent width="grouped" style={styles.content}>
          <View style={styles.hero} accessible={false}>
            <View style={styles.heroCircle}>
              <TaskIllustration name="lightbulb" size={96} />
            </View>
          </View>
          <View style={styles.heading}>
            <Text accessibilityRole="header" style={styles.title}>{lesson.title}</Text>
            <Text style={styles.encouragement}>Let’s learn something you can use today.</Text>
          </View>
          {([
            { title: 'What you’ll learn', icon: 'book', text: learningSummary },
            { title: 'One small thing to try', icon: 'pencil', text: lesson.step },
          ] as const).map((section) => (
            <View key={section.title} style={styles.card}>
              <View style={styles.sectionHeading}>
                <View style={styles.iconTile}><TaskIllustration name={section.icon} size={28} /></View>
                <Text accessibilityRole="header" style={styles.eyebrow}>{section.title}</Text>
              </View>
              <Text style={styles.summary}>{section.text}</Text>
            </View>
          ))}
          <View style={styles.details}>
            <View style={styles.detail}>
              <TaskIllustration name="breath-timer" size={24} />
              <Text style={styles.detailValue}>About {minutes} min</Text>
            </View>
            {coins > 0 ? (
              <View style={styles.detail}>
                <TaskIllustration name="coin" size={24} />
                <Text style={styles.detailValue}>{coins} coins when you finish</Text>
              </View>
            ) : null}
          </View>
        </ScreenContent>
      </ScrollView>
      <ScreenContent width="grouped" style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <ChunkyButton label="Let’s begin" shape="card" onPress={onStart} />
      </ScreenContent>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: padding.screen.horizontal, paddingVertical: spacing.md },
  headerLabel: { ...typography.body.medium, fontFamily: fonts.semibold, color: colors.text.primary },
  headerSpacer: { width: 44 },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.lg },
  content: { paddingHorizontal: padding.screen.horizontal, gap: spacing.md },
  hero: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md },
  heroCircle: { width: 152, height: 152, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.playful.sky.soft },
  heading: { gap: spacing.sm, marginBottom: spacing.sm },
  title: { ...typography.title.title1, color: colors.text.primary, textAlign: 'center' },
  encouragement: { ...typography.body.medium, color: colors.text.secondary, textAlign: 'center' },
  card: { ...card.base, padding: spacing.md, gap: spacing.md },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconTile: { ...card.taskIcon, width: 40, height: 40 },
  eyebrow: { ...typography.title.title3, fontFamily: fonts.semibold, color: colors.text.primary, flexShrink: 1 },
  summary: { ...typography.body.medium, color: colors.text.secondary },
  details: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md },
  detail: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  detailValue: { ...typography.body.small, color: colors.text.secondary, flexShrink: 1 },
  footer: { paddingHorizontal: padding.screen.horizontal, paddingTop: spacing.sm },
});
