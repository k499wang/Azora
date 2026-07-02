import { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native';

interface AnimatedCalibratingTextProps {
  textStyle: StyleProp<TextStyle>;
  // Defaults to the animated "Calibrating…". Pass a signal message (e.g.
  // "Keep still") to show that instead; the trailing dots are only animated for
  // the calibrating state.
  label?: string;
  animateDots?: boolean;
}

export function AnimatedCalibratingText({
  textStyle,
  label = 'Calibrating',
  animateDots = true,
}: AnimatedCalibratingTextProps) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (!animateDots) return;
    const interval = setInterval(() => {
      setDotCount((count) => (count === 3 ? 1 : count + 1));
    }, 450);

    return () => clearInterval(interval);
  }, [animateDots]);

  return (
    <View
      style={styles.row}
      accessibilityLabel={label}
      accessibilityRole="text"
    >
      <Text style={textStyle}>{label}</Text>
      {animateDots && (
        <Text style={[textStyle, styles.dots]}>{'.'.repeat(dotCount)}</Text>
      )}
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
