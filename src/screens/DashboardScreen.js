import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ErrorView, LoadingView } from '../components/UI';
import { colors } from '../theme';

export default function DashboardScreen({ navigation }) {
  const { token, user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return api
      .getDashboard(token)
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (error && !data) return <ErrorView message={error} />;
  if (!data) return <LoadingView />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>سلام {user?.full_name} 👋</Text>
          <Text style={styles.subGreeting}>این مسیر شما تا روز کانکور است.</Text>
        </View>
        <Pressable onPress={logout}>
          <Text style={styles.logout}>خروج</Text>
        </Pressable>
      </View>

      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>پیشرفت کلی</Text>
          <Text style={styles.progressValue}>{data.overallProgress}%</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${data.overallProgress}%` }]} />
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>🏆 امتیاز: {data.points}</Text>
          <Text style={styles.statText}>رتبه: #{data.rank}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>کورس‌های من</Text>
      <View style={styles.listGap}>
        {data.courses.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => navigation.navigate('CourseDetail', { courseId: c.id })}
            style={styles.courseCard}
          >
            <View style={styles.courseCardHeader}>
              <Text style={styles.courseTitle}>{c.title}</Text>
              <Text style={styles.coursePercent}>{c.progressPercent}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFillSmall, { width: `${c.progressPercent}%` }]} />
            </View>
            <Text style={styles.courseMeta}>
              {c.watchedVideos} از {c.totalVideos} ویدیو تماشا شده
            </Text>
          </Pressable>
        ))}
        {data.courses.length === 0 && <Text style={styles.emptyText}>هنوز در کورسی ثبت‌نام نکرده‌اید.</Text>}
      </View>

      <Text style={styles.sectionTitle}>نتایج آزمون‌ها</Text>
      <View style={styles.listGap}>
        {data.testResults.map((r) => (
          <View key={r.id} style={styles.resultRow}>
            <View>
              <Text style={styles.resultTitle}>{r.test_title}</Text>
              <Text style={styles.resultCourse}>{r.course_title}</Text>
            </View>
            <Text style={styles.resultScore}>
              {r.score}/{r.total}
            </Text>
          </View>
        ))}
        {data.testResults.length === 0 && <Text style={styles.emptyText}>هنوز آزمونی نداده‌اید.</Text>}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  container: { padding: 20, backgroundColor: colors.paper, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greeting: { fontSize: 20, fontWeight: '900', color: colors.heading },
  subGreeting: { fontSize: 13, color: colors.ink, opacity: 0.65, marginTop: 4 },
  logout: { fontSize: 13, fontWeight: '700', color: colors.danger },
  progressCard: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.line + '14',
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 14, fontWeight: '700', color: colors.heading },
  progressValue: { fontSize: 20, fontWeight: '900', color: colors.gold },
  progressBarTrack: { height: 8, backgroundColor: colors.line + '14', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 4 },
  progressBarFillSmall: { height: '100%', backgroundColor: colors.sage, borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  statText: { fontSize: 13, fontWeight: '700', color: colors.heading },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.heading, marginTop: 26, marginBottom: 10 },
  listGap: { gap: 10 },
  courseCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line + '14',
  },
  courseCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  courseTitle: { fontSize: 15, fontWeight: '700', color: colors.heading },
  coursePercent: { fontSize: 14, fontWeight: '800', color: colors.sage },
  courseMeta: { fontSize: 11, color: colors.ink, opacity: 0.55, marginTop: 8 },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line + '14',
  },
  resultTitle: { fontSize: 13, fontWeight: '700', color: colors.heading },
  resultCourse: { fontSize: 11, color: colors.ink, opacity: 0.55, marginTop: 2 },
  resultScore: { fontSize: 15, fontWeight: '800', color: colors.heading },
  emptyText: { fontSize: 13, color: colors.ink, opacity: 0.55 },
});
