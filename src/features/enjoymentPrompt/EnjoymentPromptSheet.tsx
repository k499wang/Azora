import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import ChunkyButton, { CHUNKY_TONE_SOFT } from '../../components/common/ChunkyButton';
import SlideUpSheet from '../../components/common/SlideUpSheet';
import { Text } from '../../components/common/Text';
import type { EnjoymentPromptAnswer } from '../../services/analytics/tracking';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

const AZO_HEART = require('../../../assets/mascot/azo-heart.png');
const AZO_SIZE = 128;

interface Props {
  visible: boolean;
  onAnswer: (answer: EnjoymentPromptAnswer) => void;
}

export default function EnjoymentPromptSheet({ visible, onAnswer }: Props) {
  return (
    <SlideUpSheet
      visible={visible}
      onClose={() => onAnswer('dismissed')}
      sheetStyle={styles.sheet}
      dragAnywhere
    >
      <Image source={AZO_HEART} style={styles.azo} contentFit="contain" accessible={false} />
      <View style={styles.copy}>
        <Text style={styles.title}>Are you enjoying Azora?</Text>
        <Text style={styles.subtitle}>Your answer helps us make it better.</Text>
      </View>
      <View style={styles.actions}>
        <ChunkyButton label="Like" onPress={() => onAnswer('like')} />
        <ChunkyButton
          tone={CHUNKY_TONE_SOFT}
          label="Not really"
          onPress={() => onAnswer('not_really')}
        />
      </View>
    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  azo: {
    width: AZO_SIZE,
    height: AZO_SIZE,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.title.title2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
