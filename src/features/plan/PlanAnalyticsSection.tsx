/** All-time mood, feelings, and context, shared by Profile and check-in. */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../components/common/Text';
import CardTitle from '../../components/common/CardTitle';
import Icon from '../../components/common/icons/Icon';
import MoodTrendChart from './MoodTrendChart';
import { MOOD_FACES, type MoodLevel } from '../mood/domain/moodCheckIn';
import { MOOD_FACE_HUE } from '../mood/moodFaceHue';
import type {
  ImpactInsight,
  MoodGroupInsight,
  MoodInsights,
} from './domain/moodInsights';
import { parseLocalDate } from '../../lib/calendar/weekCalendarDays';
import { card, radius } from '../../theme/card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts, typography } from '../../theme/typography';

const FACE_DOT = 44;
const FACE_GLYPH = 30;
const LEGEND_DOT = 24;
const LEGEND_GLYPH = 16;
const HERO_DOT = 88;
const HERO_FACE = 60;
const BREAKDOWN_BAR = 40;
const ROW_BAR = 22;
const COLUMN_HEIGHT = 168;
/** Best at the top, as the trend chart's axis reads. */
const LEVELS_TOP_DOWN: MoodLevel[] = [5, 4, 3, 2, 1];
const ROUGH_HUE = MOOD_FACE_HUE[2];
const GOOD_HUE = MOOD_FACE_HUE[4];

function checkIns(count: number): string {
  return `${count} ${count === 1 ? 'check-in' : 'check-ins'}`;
}

function percent(part: number, total: number): string {
  return `${Math.round((part / total) * 100)}%`;
}

function shortDate(localDate: string): string {
  return parseLocalDate(localDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function InsightCard({ title, note, children }: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <CardTitle title={title} />
        {note == null ? null : <Text style={styles.note}>{note}</Text>}
      </View>
      {children}
    </View>
  );
}

function FaceDot({ level, size, glyph, muted = false }: {
  level: MoodLevel;
  size: number;
  glyph: number;
  muted?: boolean;
}) {
  const hue = MOOD_FACE_HUE[level];
  return (
    <View
      style={[
        styles.faceDot,
        { width: size, height: size, backgroundColor: hue.fill },
        muted && styles.muted,
      ]}
    >
      <Icon name={MOOD_FACES[level - 1]} size={glyph} color={hue.ink} />
    </View>
  );
}

/** White like every card beside it; only the face carries colour. */
function MoodSummary({ insights }: { insights: MoodInsights }) {
  const { usualLevel, distribution, checkInCount, since } = insights;
  if (usualLevel == null || since == null) return null;

  return (
    <View style={[styles.card, styles.summary]}>
      <FaceDot level={usualLevel} size={HERO_DOT} glyph={HERO_FACE} />
      <View style={styles.summaryCopy}>
        <Text style={styles.summaryTitle}>Mostly {distribution[usualLevel - 1].label.toLowerCase()}</Text>
        <Text style={styles.summaryNote}>{checkIns(checkInCount)} since {shortDate(since)}</Text>
      </View>
    </View>
  );
}

/** One wide bar of every mood's share, then each feeling as its own bar. */
function MoodBreakdown({ insights }: { insights: MoodInsights }) {
  const { distribution, checkInCount, feelings } = insights;
  const logged = distribution.filter((bucket) => bucket.days > 0);
  const mostFeeling = feelings[0]?.days ?? 0;

  return (
    <InsightCard title="Mood breakdown">
      <View style={[styles.stack, styles.breakdownBar]}>
        {logged.map((bucket) => (
          <View
            key={bucket.level}
            style={{ flex: bucket.days, backgroundColor: MOOD_FACE_HUE[bucket.level].bare }}
          />
        ))}
      </View>
      <View style={styles.legend}>
        {logged.map((bucket) => (
          <View
            key={bucket.level}
            accessible
            accessibilityLabel={`${bucket.label}: ${percent(bucket.days, checkInCount)}`}
            style={styles.legendItem}
          >
            <FaceDot level={bucket.level} size={LEGEND_DOT} glyph={LEGEND_GLYPH} />
            <Text style={styles.legendValue}>{percent(bucket.days, checkInCount)}</Text>
          </View>
        ))}
      </View>
      {feelings.length === 0 ? null : (
        <>
          <View style={styles.divider} />
          {feelings.map((feeling) => {
            const hue = MOOD_FACE_HUE[feeling.level];
            return (
              <View
                key={feeling.feelingId}
                accessible
                accessibilityLabel={`${feeling.label}: ${checkIns(feeling.days)}`}
                style={styles.feelingRow}
              >
                <Text style={[styles.feelingLabel, { color: hue.ink }]} numberOfLines={1}>
                  {feeling.label}
                </Text>
                <View style={styles.rowTrack}>
                  <View
                    style={[
                      styles.rowFill,
                      { width: `${(feeling.days / mostFeeling) * 100}%`, backgroundColor: hue.bare },
                    ]}
                  />
                  <Text style={styles.rowCount}>{feeling.days}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}
    </InsightCard>
  );
}

/** A column per group, split into its moods, best at the top. */
function MoodColumns({ groups, unit }: {
  groups: MoodGroupInsight[];
  unit: (days: number) => string;
}) {
  return (
    <View style={styles.columns}>
      {groups.map((group) => (
        <View
          key={group.label}
          accessible
          accessibilityLabel={`${group.label}: ${checkIns(group.days)}`}
          style={styles.column}
        >
          <View style={[styles.stack, styles.columnBar]}>
            {LEVELS_TOP_DOWN.map((level) => {
              const days = group.distribution[level - 1].days;
              return days === 0 ? null : (
                <View key={level} style={{ flex: days, backgroundColor: MOOD_FACE_HUE[level].bare }} />
              );
            })}
          </View>
          <Text style={styles.columnLabel} numberOfLines={1}>{group.label}</Text>
          <Text style={styles.columnCount} numberOfLines={1}>{unit(group.days)}</Text>
        </View>
      ))}
    </View>
  );
}

/** Rough days grow left from the middle, good days right. */
function ImpactRow({ impact, most }: { impact: ImpactInsight; most: number }) {
  return (
    <View
      accessible
      accessibilityLabel={`${impact.label}: ${impact.roughDays} rough, ${impact.goodDays} good`}
      style={styles.impact}
    >
      <Text style={styles.impactLabel}>{impact.label}</Text>
      <View style={styles.rowTrack}>
        <View style={styles.impactHalfRough}>
          <View
            style={[
              styles.impactFillRough,
              { width: `${(impact.roughDays / most) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.impactHalf}>
          <View
            style={[
              styles.impactFillGood,
              { width: `${(impact.goodDays / most) * 100}%` },
            ]}
          />
        </View>
        <Text style={[styles.rowCount, styles.impactRoughCount]}>{impact.roughDays}</Text>
        <Text style={styles.rowCount}>{impact.goodDays}</Text>
      </View>
    </View>
  );
}

export default MoodInsightCards;

export function MoodInsightCards({ insights }: { insights: MoodInsights }) {
  const { checkInCount, since, weekdays, timesOfDay, impacts } = insights;

  if (checkInCount === 0 || since == null) {
    return (
      <InsightCard title="Your mood">
        <View style={styles.emptyFaces}>
          {MOOD_FACES.map((face, index) => (
            <FaceDot key={face} level={(index + 1) as MoodLevel} size={FACE_DOT} glyph={FACE_GLYPH} muted />
          ))}
        </View>
        <Text style={styles.empty}>Check in once and your mood picture starts here.</Text>
      </InsightCard>
    );
  }

  const mostImpact = Math.max(...impacts.map((impact) => Math.max(impact.roughDays, impact.goodDays)));

  return (
    <>
      <MoodSummary insights={insights} />

      <InsightCard title="Your mood over time" note={`Since ${shortDate(since)}`}>
        <MoodTrendChart points={insights.trend} />
      </InsightCard>

      <MoodBreakdown insights={insights} />

      <InsightCard title="Moods during the week">
        <MoodColumns groups={weekdays} unit={String} />
      </InsightCard>

      {timesOfDay.every((group) => group.days === 0) ? null : (
        <InsightCard title="Moods through the day">
          <MoodColumns groups={timesOfDay} unit={checkIns} />
        </InsightCard>
      )}

      {impacts.length === 0 ? null : (
        <InsightCard title="Impacts" note="Rough days on the left, good days on the right">
          {impacts.map((impact) => (
            <ImpactRow key={impact.tagId} impact={impact} most={mostImpact} />
          ))}
        </InsightCard>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    ...card.base,
    ...card.shadow,
    padding: spacing.md,
    gap: spacing.md,
  },
  heading: { gap: spacing.xs },
  note: { ...typography.label.medium, fontFamily: fonts.medium, color: colors.text.secondary },
  empty: { ...typography.label.medium, fontFamily: fonts.medium, color: colors.text.secondary, textAlign: 'center' },
  emptyFaces: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  muted: { opacity: 0.35 },
  faceDot: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  summaryCopy: { alignItems: 'center', gap: spacing.xs },
  summaryTitle: {
    ...typography.title.title2,
    fontFamily: fonts.semibold,
    color: colors.text.primary,
  },
  summaryNote: { ...typography.label.medium, fontFamily: fonts.medium, color: colors.text.secondary },
  stack: {
    overflow: 'hidden',
    backgroundColor: colors.neutral[100],
  },
  breakdownBar: {
    flexDirection: 'row',
    height: BREAKDOWN_BAR,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
  },
  legend: { flexDirection: 'row', justifyContent: 'space-around' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendValue: {
    ...typography.label.large,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
    color: colors.text.secondary,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border.default },
  feelingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  feelingLabel: { ...typography.label.large, fontFamily: fonts.semibold, width: '42%' },
  rowTrack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_BAR,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
  },
  rowFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: radius.full,
  },
  rowCount: {
    ...typography.label.detail,
    fontFamily: fonts.semibold,
    fontVariant: ['tabular-nums'],
    color: colors.text.secondary,
    position: 'absolute',
    right: spacing.sm,
  },
  columns: { flexDirection: 'row', gap: spacing.sm },
  column: { flex: 1, alignItems: 'center', gap: spacing.xs },
  columnBar: {
    alignSelf: 'stretch',
    height: COLUMN_HEIGHT,
    borderRadius: radius.medium,
    borderCurve: 'continuous',
    marginBottom: spacing.xs,
  },
  columnLabel: { ...typography.label.medium, fontFamily: fonts.medium, color: colors.text.secondary },
  columnCount: {
    ...typography.label.detail,
    fontVariant: ['tabular-nums'],
    color: colors.text.tertiary,
  },
  impact: { gap: spacing.xs },
  impactLabel: { ...typography.label.large, fontFamily: fonts.semibold, color: colors.text.primary },
  impactHalf: { flex: 1, height: '100%' },
  impactHalfRough: { flex: 1, height: '100%', alignItems: 'flex-end' },
  impactFillRough: {
    height: '100%',
    backgroundColor: ROUGH_HUE.bare,
    borderTopLeftRadius: radius.full,
    borderBottomLeftRadius: radius.full,
  },
  impactFillGood: {
    height: '100%',
    backgroundColor: GOOD_HUE.bare,
    borderTopRightRadius: radius.full,
    borderBottomRightRadius: radius.full,
  },
  impactRoughCount: { right: undefined, left: spacing.sm },
});
