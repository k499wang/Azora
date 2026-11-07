import { useEffect, useRef } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AiDataConsentScreenProps } from '../../app/navigation';
import ChunkyButton, { CHUNKY_TONE_QUIET } from '../../components/common/ChunkyButton';
import TaskIllustration from '../../components/common/icons/TaskIllustration';
import { Text } from '../../components/common/Text';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';
import { AI_POLICY_SECTIONS, AI_POLICY_UPDATED } from './aiPolicy';
import { settleAiDataConsent } from './ensureAiDataConsent';

const PRIVACY_URL = 'https://www.tryazora.app/privacy';
const HERO_TILE = 72;
const HERO_ART = 48;

/** Azora's AI policy: a native sheet, and the only way into anything sent to Google Gemini. */
export default function AiDataConsentScreen({ navigation }: AiDataConsentScreenProps) {
  const insets = useSafeAreaInsets();
  const answer = useRef(false);

  useEffect(() => () => settleAiDataConsent(answer.current), []);

  const respond = (allowed: boolean) => {
    answer.current = allowed;
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.heroTile}>
            <TaskIllustration name="shield-lock-outline" size={HERO_ART} />
          </View>
          <Text accessibilityRole="header" style={styles.title}>Azora’s AI Policy</Text>
          <Text style={styles.updated}>{AI_POLICY_UPDATED}</Text>
        </View>
        <View style={styles.policy}>
          {AI_POLICY_SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
              {section.paragraphs.map((paragraph) => (
                <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>
              ))}
            </View>
          ))}
        </View>
        <Pressable
          accessibilityRole="link"
          hitSlop={spacing.sm}
          onPress={() => { void Linking.openURL(PRIVACY_URL); }}
        >
          <Text style={styles.link}>Read our Privacy Policy</Text>
        </Pressable>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <ChunkyButton label="Allow" onPress={() => respond(true)} />
        <ChunkyButton label="Don’t Allow" tone={CHUNKY_TONE_QUIET} onPress={() => respond(false)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.canvas },
  scroll: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  header: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
  heroTile: {
    ...card.taskIcon,
    width: HERO_TILE,
    height: HERO_TILE,
    borderRadius: radius.card,
    marginBottom: spacing.xs,
  },
  title: { ...typography.title.title1, color: colors.text.primary, textAlign: 'center' },
  updated: { ...typography.caption.caption1, color: colors.text.tertiary, textAlign: 'center' },
  policy: { gap: spacing.lg, paddingHorizontal: spacing.xs },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.body.large, fontFamily: fonts.semibold, color: colors.text.primary },
  paragraph: { ...typography.body.small, color: colors.text.secondary },
  link: {
    ...typography.body.small,
    fontFamily: fonts.semibold,
    color: colors.primary.blue700,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
});
