import { Image, StyleSheet, View } from 'react-native';
import ChunkyButton from '../../components/common/ChunkyButton';
import Icon from '../../components/common/icons/Icon';
import { Text } from '../../components/common/Text';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

export default function PhotoCleanupPromptCard({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.artwork}>
        <View style={styles.speechBubble}>
          <Text style={styles.speechText}>I can help!</Text>
        </View>
        <Image
          source={require('../../../assets/Poses/koala_pose_analyzing.png')}
          style={styles.mascot}
          resizeMode="contain"
        />
        <View style={styles.whiteCurve} />
      </View>
      <View style={styles.copy}>
        <View style={styles.messageRow}>
          <Icon name="todo-broom" size={24} color={colors.primary.blue700} />
          <Text style={styles.message}>Not sure where to start?</Text>
        </View>
        <Text style={styles.supporting}>Take a photo of your messy room and I’ll give you <Text style={styles.emphasis}>step-by-step cleaning instructions.</Text></Text>
        <ChunkyButton
          label="Take a photo"
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
    backgroundColor: colors.primary.blue100,
  },
  mascot: {
    position: 'absolute',
    zIndex: 1,
    width: 132,
    height: 142,
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
  whiteCurve: {
    position: 'absolute',
    zIndex: 0,
    width: '150%',
    height: 100,
    left: '-25%',
    bottom: -58,
    borderRadius: radius.full,
    backgroundColor: colors.background.card,
  },
  copy: { gap: spacing.sm, padding: spacing.mdPlus },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  message: {
    ...typography.heading.heading2,
    fontFamily: fonts.semibold,
    color: colors.primary.blue700,
  },
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
