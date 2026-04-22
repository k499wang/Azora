import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

function getGreeting(now: Date) {
  const hour = now.getHours();

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 18) {
    return 'Good afternoon';
  }

  return 'Good evening';
}

interface DailyQuoteProps {
  name?: string;
}

export default function DailyQuote({ name = 'Kevin' }: DailyQuoteProps) {
  const greeting = getGreeting(new Date());

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{`${greeting}, ${name}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {
    ...typography.title.title1,
    color: colors.text.primary,
    textAlign: 'center',
  },
});
