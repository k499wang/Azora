import { Text } from '../../common/Text';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { fonts, typography } from '../../../theme/typography';

const CAMERA_PPG_ILLUSTRATION = require('../../../../assets/onboarding/camerappg.png');

interface BaselineIntroContentProps {
  sessionSec: number;
}

export function BaselineIntroContent({ sessionSec }: BaselineIntroContentProps) {
  return (
    <>
      <View style={styles.heading}>
        <Text style={styles.headingTitle}>Read this first</Text>
        <Text style={styles.headingSubtitle}>
          A clean {sessionSec}-second reading is what calibrates your plan.
          Set yourself up with these four cues.
        </Text>
      </View>

      <View style={styles.illustrationWrap}>
        <Image
          source={CAMERA_PPG_ILLUSTRATION}
          style={styles.illustration}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={0}
          accessibilityLabel="Fingertip covering the back camera and flash"
        />
      </View>
    </>
  );
}

export default BaselineIntroContent;

const styles = StyleSheet.create({
  heading: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  headingTitle: {
    fontFamily: fonts.semibold,
    fontWeight: '500',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: colors.text.primary,
  },
  headingSubtitle: {
    ...typography.body.small,
    color: colors.text.secondary,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -spacing.lg,
  },
  illustration: {
    width: '100%',
    height: 200,
  },
});
