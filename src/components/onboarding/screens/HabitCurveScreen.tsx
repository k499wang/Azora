import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import OnboardingScreenLayout from '../OnboardingScreenLayout';
import OnboardingPrimaryButton from '../OnboardingPrimaryButton';
import ChartCallout from '../ChartCallout';
import ChartTicks from '../ChartTicks';
import { ChartAxes, ChartAxisTitles } from '../ChartAxes';
import { chart, chartWrap } from '../chartTokens';
import { areaPath, gridPath, plotBox, smoothPath } from '../chartPaths';
import { useChartWidth } from '../useChartReveal';
import { FEEL_BETTER_DAYS, FEEL_BETTER_PERCENT } from '../../../data/socialProof';

interface HabitCurveScreenProps {
  stepIndex: number;
  stepCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const SAMPLE_COUNT = 64;
const SERIES_START = (chart.lineWidth + chart.axisWidth) / 2;

/**
 * Small fixed nudges, as a share of the plot height, that give the solo line
 * the uneven feel of a real log. Every other sample stays exactly on
 * `aloneAt`, so the level the line reads at is unchanged.
 */
const ALONE_JITTER = [0, 0.03, 0, -0.025, 0, 0.035, 0, -0.03, 0];
/** On an unnudged sample, so the face sits exactly on the drawn line. */
const CALLOUT_UNIT = 0.75;

/** where the same twenty days land without a plan holding them together */
const ALONE_PEAK_PERCENT = 11;

/**
 * Both curves leave the same point, because day one is never the problem.
 * On their own people start, stall, and end the run roughly where they began.
 * With a plan the gain compounds and then plateaus, which is what a habit looks
 * like — it stops costing anything and stops climbing much either.
 *
 * The plan is the filled area and going it alone is the line drawn over it,
 * the same relationship the other onboarding plots use.
 */
function aloneAt(unit: number): number {
  return (ALONE_PEAK_PERCENT / FEEL_BETTER_PERCENT) * Math.sin((Math.PI / 2) * unit) * 0.9;
}

function withAzoraAt(unit: number): number {
  return 1 - Math.exp(-2.6 * unit);
}

export default function HabitCurveScreen({
  stepIndex,
  stepCount,
  onContinue,
  onBack,
}: HabitCurveScreenProps) {
  const { width, onLayout } = useChartWidth();
  const box = useMemo(() => plotBox(width), [width]);

  // Both series leave one shared point, nudged in off the axes so the thick
  // line's round cap rests in the corner instead of straddling it.
  const startX = box.left + SERIES_START;
  const baseY = box.top + box.height - SERIES_START;
  const xAt = (unit: number) => startX + unit * (box.left + box.width - startX);
  const curveY = (ratio: number) => baseY - ratio * (baseY - box.top - chart.topInset);
  const plotClip = useMemo(
    () =>
      Skia.XYWHRect(
        box.left + chart.axisWidth / 2,
        0,
        box.width - chart.axisWidth / 2,
        box.top + box.height - chart.axisWidth / 2,
      ),
    [box],
  );

  const azoraArea = useMemo(() => {
    const points = Array.from({ length: SAMPLE_COUNT }, (_, i) => {
      const u = i / (SAMPLE_COUNT - 1);
      return { x: xAt(u), y: curveY(withAzoraAt(u)) };
    });
    return areaPath(smoothPath(points), box);
  }, [box]);

  const aloneLine = useMemo(() => {
    const p = Skia.Path.Make();
    ALONE_JITTER.forEach((jitter, i) => {
      const u = i / (ALONE_JITTER.length - 1);
      const y = curveY(aloneAt(u)) - jitter * box.height;
      if (i === 0) p.moveTo(xAt(u), y);
      else p.lineTo(xAt(u), y);
    });
    return p;
  }, [box]);

  const grid = useMemo(() => gridPath(box, chart.gridCount), [box]);

  return (
    <OnboardingScreenLayout
      title={`Azora users report feeling ${FEEL_BETTER_PERCENT}% better after ${FEEL_BETTER_DAYS} days.`}
      subtitle="Sticking to a plan is hard. Azora carries it, so all that is left for you is the next small step."
      progress={stepIndex / stepCount}
      onBack={onBack}
      footer={<OnboardingPrimaryButton label="Continue" onPress={onContinue} />}
    >
      <View style={styles.chartWrap}>
        <View style={styles.plot} onLayout={onLayout}>
          {width > 0 ? (
            <>
              <Canvas style={StyleSheet.absoluteFill}>
                <Path
                  path={grid}
                  style="stroke"
                  strokeWidth={chart.gridWidth}
                  color={chart.gridColor}
                />

                <Group clip={plotClip}>
                  <Path path={azoraArea} style="fill" color={chart.areaColor} />

                  <Path
                    path={aloneLine}
                    style="stroke"
                    strokeWidth={chart.lineWidth}
                    strokeCap="round"
                    strokeJoin="round"
                    color={chart.comparisonColor}
                  />
                </Group>

                <ChartAxes width={width} />
              </Canvas>

              <ChartAxisTitles y="Feeling better" yTitlePosition="above" />

              <ChartCallout
                x={xAt(CALLOUT_UNIT)}
                y={curveY(withAzoraAt(CALLOUT_UNIT))}
                label="With Azora"
                mood="calm"
                side="left"
              />
              <ChartCallout
                x={xAt(CALLOUT_UNIT)}
                y={curveY(aloneAt(CALLOUT_UNIT))}
                label="On your own"
                mood="tense"
                side="left"
              />
            </>
          ) : null}
        </View>
        <ChartTicks start="Today" end={`Day ${FEEL_BETTER_DAYS}`} />
      </View>
    </OnboardingScreenLayout>
  );
}

const styles = StyleSheet.create({
  chartWrap,
  plot: {
    width: '100%',
    height: chart.height,
  },
});
