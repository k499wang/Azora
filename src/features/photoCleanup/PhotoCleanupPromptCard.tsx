import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import AzoPortrait from '../mascot/AzoPortrait';
import ChunkyButton from '../../components/common/ChunkyButton';
import { Text } from '../../components/common/Text';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

interface Props {
  onPress: () => void;
  freeCleanupAvailable?: boolean;
}

export default function PhotoCleanupPromptCard({
  onPress,
  freeCleanupAvailable = false,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.artwork}>
        <Svg
          viewBox="0 0 360 172"
          preserveAspectRatio="none"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <LinearGradient id="toolkitBackgroundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.primary.blue100} stopOpacity={1} />
              <Stop offset="100%" stopColor={colors.primary.blue100} stopOpacity={0.4} />
            </LinearGradient>
          </Defs>
          <Path d="M0 0H360V146 Q180 72 0 146Z" fill="url(#toolkitBackgroundGradient)" />
        </Svg>
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>I can help!</Text>
        </View>
        <View style={styles.mascot}>
          <AzoPortrait size={132} active={false} />
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.supporting}>Take a photo of your messy room and I’ll give you <Text style={styles.emphasis}>step-by-step cleaning instructions.</Text></Text>
        <ChunkyButton
          label={freeCleanupAvailable ? 'Try For Free!' : 'Take a photo'}
          onPress={onPress}
          minHeight={48}
          haptic="tap"
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    minHeight: 326,
    overflow: 'hidden',
    borderRadius: radius.large,
  },
  artwork: {
    height: 172,
    overflow: 'hidden',
    backgroundColor: colors.background.card,
  },
  mascot: {
    position: 'absolute',
    zIndex: 1,
    width: 132,
    left: '50%',
    bottom: 0,
    marginLeft: -66,
  },
  speechBubble: {
    position: 'absolute',
    zIndex: 2,
    top: spacing.lg,
    right: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.background.card,
  },
  speechText: {
    ...typography.label.medium,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  copy: { gap: spacing.sm, padding: spacing.mdPlus },
  supporting: {
    ...typography.body.medium,
    color: colors.text.primary,
  },
  emphasis: {
    ...typography.body.medium,
    fontFamily: fonts.semibold,
    color: colors.primary.blue700,
  },
  button: {
    marginTop: spacing.md,
  },
});
