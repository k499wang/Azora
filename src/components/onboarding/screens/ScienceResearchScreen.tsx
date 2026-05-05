import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import Icon from '../../common/icons/Icon';
import type { IconName } from '../../common/icons/Icon';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';

const HARVARD_LOGO = require('../../../../assets/harvard.png');
const STANFORD_LOGO = require('../../../../assets/standford.png');

interface ScienceResearchScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

type ResearchRow =
  | {
      kind: 'image';
      logo: ImageSourcePropType;
      headline: string;
      body: string;
    }
  | {
      kind: 'icon';
      icon: IconName;
      accent: string;
      headline: string;
      body: string;
    };

const RESEARCH_ROWS: ResearchRow[] = [
  {
    kind: 'image',
    logo: HARVARD_LOGO,
    headline: 'Harvard Medical School',
    body: 'Controlled breathing activates the parasympathetic nervous system, lowering cortisol within minutes.',
  },
  {
    kind: 'image',
    logo: STANFORD_LOGO,
    headline: 'Stanford University',
    body: 'Resonant breathing at 5.5 breaths/min optimizes HRV and autonomic balance.',
  },
  {
    kind: 'icon',
    icon: 'research-paper',
    accent: colors.primary.blue600,
    headline: 'Frontiers in Psychology',
    body: 'Meta-analysis of 15 RCTs: breathwork significantly reduces anxiety vs. control conditions.',
  },
];

export default function ScienceResearchScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: ScienceResearchScreenProps) {
  const rowAnims = useRef(RESEARCH_ROWS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      160,
      rowAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [rowAnims]);

  return (
    <OnboardingScreenLayout
      title="Backed by leading research."
      subtitle="The breathing protocols inside Azora come straight from peer-reviewed studies."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Got it" onPress={onContinue} />}
    >
      <View style={styles.rows}>
        {RESEARCH_ROWS.map((row, index) => (
          <Animated.View
            key={row.headline}
            style={[
              styles.row,
              index !== 0 && styles.rowDivider,
              {
                opacity: rowAnims[index],
                transform: [
                  {
                    translateY: rowAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {row.kind === 'image' ? (
              <Image source={row.logo} style={styles.logo} resizeMode="contain" />
            ) : (
              <View style={styles.iconWrap}>
                <Icon name={row.icon} size={32} color={row.accent} />
              </View>
            )}
            <View style={styles.text}>
              <Text style={styles.headline}>{row.headline}</Text>
              <Text style={styles.body}>{row.body}</Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  rows: {
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  logo: {
    width: 44,
    height: 44,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  headline: {
    fontFamily: fonts.semibold,
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
    color: colors.text.primary,
  },
  body: {
    ...typography.body.small,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
  },
});
