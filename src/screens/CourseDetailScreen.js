import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorView, LoadingView } from '../components/UI';
import { colors } from '../theme';

function formatDuration(sec) {
  const m = Math.floor((sec || 0) / 60);
  const s = (sec || 0) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function CourseDetailScreen({ route, navigation }) {
  const { courseId } = route.params;
  const { token } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    api.getCourse(courseId).then(setCourse).catch((e) => setError(e.message));
    api.getEnrollment(courseId, token).then(setEnrollment).catch(() => {});
  }, [courseId, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleEnroll(method) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await api.checkout({ course_id: courseId, method }, token);
      if (res.provider === 'stripe' && res.paymentUrl) {
        await Linking.openURL(res.paymentUrl);
        setNotice('پرداخت را در مرورگر تکمیل کنید، سپس به این صفحه برگردید.');
        return;
      }
      setNotice('درخواست ثبت شد. برای بررسی وضعیت، این صفحه را بازخوانی کنید.');
      const enrollmentRes = await api.getEnrollment(courseId, token);
      setEnrollment(enrollmentRes);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !course) return <ErrorView message={error} />;
  if (!course) return <LoadingView />;

  const canAccess = enrollment?.accessGranted;
  const isPending = enrollment?.status === 'pending';
  const isFailed = enrollment?.status === 'failed';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.coverBar, { backgroundColor: course.cover_color || colors.navy }]} />
      <Text style={styles.subject}>{course.subject}</Text>
      <Text style={styles.title}>{course.title}</Text>
      {course.description ? <Text style={styles.description}>{course.description}</Text> : null}

      <View style={styles.priceCard}>
        <View style={styles.flex1}>
          <Text style={styles.price}>
            {course.price === 0 ? 'رایگان' : `${course.price} افغانی`}
            {course.price > 0 && course.price_usd > 0 ? ` (یا $${course.price_usd} با کارت)` : ''}
          </Text>
          {canAccess ? <Text style={styles.successText}>✓ شما در این کورس ثبت‌نام هستید</Text> : null}
          {isPending && !canAccess ? <Text style={styles.pendingText}>پرداخت شما در انتظار تایید است.</Text> : null}
          {isFailed && !canAccess ? <Text style={styles.failedText}>پرداخت ناموفق بود. دوباره امتحان کنید.</Text> : null}
        </View>
      </View>

      {isPending && enrollment?.paymentId ? (
        <Button
          title="مشاهده وضعیت پرداخت"
          onPress={() => navigation.navigate('PaymentStatus', { paymentId: enrollment.paymentId })}
          variant="secondary"
          style={styles.paymentStatusButton}
        />
      ) : null}

      {!canAccess && course.price === 0 && (
        <Button
          title={busy ? 'در حال پردازش...' : 'ثبت‌نام رایگان'}
          onPress={() => handleEnroll('manual')}
          disabled={busy || isPending}
          style={styles.goldButton}
        />
      )}

      {!canAccess && course.price > 0 && (
        <View style={styles.enrollActions}>
          {course.price_usd > 0 && (
            <Button
              title={busy ? 'در حال پردازش...' : '💳 پرداخت با کارت'}
              onPress={() => handleEnroll('card')}
              disabled={busy}
              style={styles.goldButton}
            />
          )}
          <Button
            title={isPending ? 'پرداخت در انتظار' : '🏦 حواله بانکی (تایید دستی)'}
            onPress={() => handleEnroll('manual')}
            disabled={busy || isPending}
            variant="secondary"
          />
        </View>
      )}

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>ویدیوهای درسی</Text>
      <View style={styles.listGap}>
        {course.videos.map((v, i) => (
          <Pressable
            key={v.id}
            disabled={!canAccess}
            onPress={() => navigation.navigate('VideoPlayer', { videoId: v.id, title: v.title })}
            style={[styles.rowItem, !canAccess && styles.rowItemDisabled]}
          >
            <View style={styles.rowLeft}>
              <View style={styles.indexBadge}>
                <Text style={styles.indexBadgeText}>{i + 1}</Text>
              </View>
              <Text style={styles.rowTitle}>{v.title}</Text>
            </View>
            <Text style={styles.rowMeta}>{formatDuration(v.duration_seconds)}</Text>
          </Pressable>
        ))}
        {course.videos.length === 0 && <Text style={styles.emptyText}>هنوز ویدیویی اضافه نشده.</Text>}
      </View>

      <Text style={styles.sectionTitle}>آزمون‌ها</Text>
      <View style={styles.listGap}>
        {course.tests.map((t) => (
          <Pressable
            key={t.id}
            disabled={!canAccess}
            onPress={() => navigation.navigate('Test', { testId: t.id, title: t.title })}
            style={[styles.rowItem, !canAccess && styles.rowItemDisabled]}
          >
            <Text style={styles.rowTitle}>{t.title}</Text>
            <Text style={styles.rowLink}>شروع آزمون ←</Text>
          </Pressable>
        ))}
        {course.tests.length === 0 && <Text style={styles.emptyText}>هنوز آزمونی اضافه نشده.</Text>}
      </View>

      {canAccess && (
        <Button
          title="💬 پرسش و پاسخ کورس"
          onPress={() => navigation.navigate('ForumList', { courseId })}
          variant="secondary"
          style={styles.forumButton}
        />
      )}

      {!canAccess && (
        <Text style={styles.footNote}>برای دسترسی به ویدیوها و آزمون‌ها ابتدا باید ثبت‌نام کنید.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.paper, flexGrow: 1 },
  coverBar: { height: 6, borderRadius: 4, marginBottom: 14 },
  subject: { fontSize: 12, fontWeight: '700', color: colors.sage, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '900', color: colors.heading },
  description: { fontSize: 14, color: colors.ink, opacity: 0.75, marginTop: 8, lineHeight: 20 },
  flex1: { flex: 1 },
  priceCard: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line + '14',
  },
  price: { fontSize: 18, fontWeight: '800', color: colors.heading },
  successText: { color: colors.sage, fontWeight: '700', fontSize: 13, marginTop: 6 },
  pendingText: { color: '#B45309', fontWeight: '700', fontSize: 13, marginTop: 6 },
  failedText: { color: colors.danger, fontWeight: '700', fontSize: 13, marginTop: 6 },
  goldButton: { backgroundColor: colors.gold, marginTop: 14 },
  paymentStatusButton: { marginTop: 10 },
  enrollActions: { gap: 10, marginTop: 14 },
  notice: {
    marginTop: 12,
    fontSize: 13,
    color: colors.ink,
    backgroundColor: colors.gold + '1a',
    padding: 10,
    borderRadius: 10,
  },
  errorText: { marginTop: 10, color: colors.danger, fontSize: 13 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.heading, marginTop: 28, marginBottom: 10 },
  listGap: { gap: 8 },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line + '14',
  },
  rowItemDisabled: { opacity: 0.55 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  indexBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.line + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadgeText: { fontSize: 12, fontWeight: '700', color: colors.heading },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.heading },
  rowMeta: { fontSize: 12, color: colors.ink, opacity: 0.6 },
  rowLink: { fontSize: 12, fontWeight: '700', color: colors.sage },
  emptyText: { fontSize: 13, color: colors.ink, opacity: 0.55 },
  forumButton: { marginTop: 28 },
  footNote: { fontSize: 12, color: colors.ink, opacity: 0.55, textAlign: 'center', marginTop: 24 },
});
