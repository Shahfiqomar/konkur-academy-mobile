import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorView, LoadingView } from '../components/UI';
import { colors } from '../theme';

export default function LiveClassScreen({ route }) {
  const { courseId } = route.params;
  const { token, user } = useAuth();
  const [sessions, setSessions] = useState(null);
  const [form, setForm] = useState({ title: '', scheduled_at: '' });
  const [error, setError] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);

  const canSchedule = user?.role === 'teacher' || user?.role === 'admin';

  const load = useCallback(() => {
    return api
      .getLiveSessions(courseId, token)
      .then((s) => {
        setSessions(s);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [courseId, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSchedule() {
    if (!form.title.trim() || !form.scheduled_at.trim()) return;
    setScheduling(true);
    setError('');
    try {
      await api.createLiveSession({ course_id: courseId, ...form }, token);
      setForm({ title: '', scheduled_at: '' });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setScheduling(false);
    }
  }

  if (activeRoom) {
    return (
      <View style={styles.roomContainer}>
        <Pressable onPress={() => setActiveRoom(null)} style={styles.backRow}>
          <Text style={styles.backLink}>→ بازگشت به لیست جلسات</Text>
        </Pressable>
        <WebView
          source={{ uri: `https://meet.jit.si/${activeRoom}` }}
          style={styles.webview}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          mediaCapturePermissionGrantType="grant"
        />
      </View>
    );
  }

  if (error && !sessions) return <ErrorView message={error} />;
  if (!sessions) return <LoadingView />;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {canSchedule && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>برنامه‌ریزی جلسه‌ی جدید</Text>
            <TextInput
              style={styles.input}
              placeholder="عنوان جلسه (مثلاً مرور فصل سلول)"
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
            />
            <TextInput
              style={styles.input}
              placeholder="زمان (مثال: 2026-09-10T18:00)"
              autoCapitalize="none"
              value={form.scheduled_at}
              onChangeText={(v) => setForm({ ...form, scheduled_at: v })}
            />
            <Button
              title={scheduling ? 'در حال ثبت...' : 'برنامه‌ریزی'}
              onPress={handleSchedule}
              disabled={scheduling || !form.title.trim() || !form.scheduled_at.trim()}
              style={styles.scheduleButton}
            />
          </View>
        )}

        <View style={styles.listGap}>
          {sessions.map((s) => (
            <View key={s.id} style={styles.sessionRow}>
              <View style={styles.flex1}>
                <Text style={styles.sessionTitle}>{s.title}</Text>
                <Text style={styles.sessionMeta}>{new Date(s.scheduled_at).toLocaleString('fa-IR')}</Text>
              </View>
              <Button title="ورود به کلاس" onPress={() => setActiveRoom(s.room_name)} style={styles.joinButton} />
            </View>
          ))}
          {sessions.length === 0 && <Text style={styles.emptyText}>هنوز جلسه‌ای برنامه‌ریزی نشده.</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  container: { padding: 20, flexGrow: 1 },
  errorText: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line + '14',
    marginBottom: 20,
    gap: 8,
  },
  formTitle: { fontSize: 14, fontWeight: '800', color: colors.heading, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.line + '33',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
  },
  scheduleButton: { marginTop: 4 },
  listGap: { gap: 8 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line + '14',
    gap: 10,
  },
  flex1: { flex: 1 },
  sessionTitle: { fontSize: 14, fontWeight: '700', color: colors.heading },
  sessionMeta: { fontSize: 11, color: colors.ink, opacity: 0.55, marginTop: 4 },
  joinButton: { backgroundColor: colors.gold, paddingVertical: 9, paddingHorizontal: 14 },
  emptyText: { fontSize: 13, color: colors.ink, opacity: 0.55, textAlign: 'center', marginTop: 20 },
  roomContainer: { flex: 1, backgroundColor: '#000' },
  backRow: { backgroundColor: colors.navy, paddingHorizontal: 16, paddingVertical: 12 },
  backLink: { color: colors.gold, fontWeight: '700', fontSize: 13 },
  webview: { flex: 1 },
});
