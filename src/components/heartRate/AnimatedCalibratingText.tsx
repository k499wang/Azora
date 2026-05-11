import { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

interface AnimatedCalibratingTextProps {
  textStyle: StyleProp<TextStyle>;
}

export function AnimatedCalibratingText({ textStyle }: AnimatedCalibratingTextProps) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((count) => (count === 3 ? 1 : count + 1));
    }, 450);

    return () => clearInterval(interval);
  }, []);

  return (
    <View
      style={styles.row}
      accessibilityLabel="Calibrating"
      accessibilityRole="text"
    >
      <Text style={textStyle}>Calibrating</Text>
      <Text style={[textStyle, styles.dots]}>{'.'.repeat(dotCount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  dots: {
    width: 24,
    textAlign: 'left',
  },
});
