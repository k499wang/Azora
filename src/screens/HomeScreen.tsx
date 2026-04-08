import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, padding, margin } from '../theme/spacing';
import Pill from '../components/Pill';
import BreatheButton from '../components/BreatheButton';

const USER_NAME = 'Kevin';
const DAILY_STREAK = 7;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
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
        <BreatheButton onPress={() => {}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
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
    alignItems: 'center',
    paddingHorizontal: padding.screen.horizontal,
    marginTop: margin.sectionGap,
  },
  subtitle: {
    ...typography.body.large,
    color: colors.text.tertiary,
    marginTop: margin.itemGap,
  },
});
