import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ErrorView, LoadingView } from '../components/UI';
import { colors } from '../theme';

function SimpleBarChart({ data, labelKey, valueKey, color, suffix = '' }) {
  const maxValue = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0));
  return (
    <View style={styles.chart}>
      {data.map((item, i) => {
        const value = Number(item[valueKey]) || 0;
        const percent = Math.max(2, (value / maxValue) * 100);
        return (
          <View key={i} style={styles.chartRow}>
            <View style={styles.chartRowHeader}>
              <Text style={styles.chartLabel}>{item[labelKey]}</Text>
              <Text style={styles.chartValue}>
                {value}
                {suffix}
              </Text>
            </View>
            <View style={styles.chartTrack}>
              <View style={[styles.chartFill, { width: `${percent}%`, backgroundColor: color }]} />
            </View>
          </View>
        );
      })}
      {data.length === 0 && <Text style={styles.emptyText}>داده‌ای برای نمایش وجود ندارد.</Text>}
    </View>
  );
}

export default function AdminStatsScreen() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAdminStats(token).then(setStats).catch((e) => setError(e.message));
  }, [token]);

  if (error && !stats) return <ErrorView message={error} />;
  if (!stats) return <LoadingView />;

  const cards = [
    { label: 'مجموع شاگردان', value: stats.totalStudents },
    { label: 'مجموع استادان', value: stats.totalTeachers },
    { label: 'مجموع کورس‌ها', value: stats.totalCourses },
    { label: 'مجموع درآمد (افغانی)', value: stats.totalRevenue },
  ];

  const otherCurrencies = (stats.revenueByCurrency || []).filter((r) => r.currency !== 'AFN' && r.total > 0);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.cardsGrid}>
        {cards.map((c) => (
          <View key={c.label} style={styles.statCard}>
            <Text style={styles.statValue}>{c.value}</Text>
            <Text style={styles.statLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      {otherCurrencies.length > 0 && (
        <View style={styles.chipRow}>
          {otherCurrencies.map((r) => (
            <View key={r.currency} style={styles.chip}>
              <Text style={styles.chipText}>
                درآمد کارتی: {r.total} {r.currency}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>شاگردان به تفکیک رشته</Text>
        <SimpleBarChart data={stats.perBranch} labelKey="branch" valueKey="student_count" color={colors.navy} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>درآمد به تفکیک کورس</Text>
        <SimpleBarChart data={stats.perCourse} labelKey="course" valueKey="revenue" color={colors.gold} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>میانگین نمرات آزمون به تفکیک کورس (%)</Text>
        <SimpleBarChart
          data={stats.avgScoresPerCourse}
          labelKey="course"
          valueKey="avg_percent"
          color={colors.sage}
          suffix="%"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.paper, flexGrow: 1 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line + '14',
  },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.heading },
  statLabel: { fontSize: 11, color: colors.ink, opacity: 0.55, marginTop: 4, textAlign: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line + '14',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.heading },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line + '14',
    marginTop: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.heading, marginBottom: 14 },
  chart: { gap: 14 },
  chartRow: { gap: 6 },
  chartRowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { fontSize: 13, fontWeight: '700', color: colors.heading },
  chartValue: { fontSize: 13, fontWeight: '800', color: colors.ink },
  chartTrack: { height: 8, backgroundColor: colors.line + '14', borderRadius: 4, overflow: 'hidden' },
  chartFill: { height: '100%', borderRadius: 4 },
  emptyText: { fontSize: 13, color: colors.ink, opacity: 0.55 },
});
