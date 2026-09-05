import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorView, LoadingView } from '../components/UI';
import { colors } from '../theme';

const ROLE_LABELS = { admin: 'مدیر', teacher: 'استاد' };

export default function ForumThreadScreen({ route }) {
  const { threadId } = route.params;
  const { token } = useAuth();
  const [thread, setThread] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    return api
      .getThread(threadId, token)
      .then((t) => {
        setThread(t);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [threadId, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleReply() {
    if (!message.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.replyThread(threadId, { message }, token);
      setMessage('');
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !thread) return <ErrorView message={error} />;
  if (!thread) return <LoadingView />;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.threadCard}>
          <Text style={styles.title}>{thread.title}</Text>
          <Text style={styles.meta}>پرسیده شده توسط {thread.author_name}</Text>
          {thread.body ? <Text style={styles.body}>{thread.body}</Text> : null}
        </View>

        <View style={styles.repliesList}>
          {thread.replies.map((r) => (
            <View key={r.id} style={styles.replyCard}>
              <View style={styles.replyHeader}>
                <Text style={styles.replyAuthor}>{r.author_name}</Text>
                {ROLE_LABELS[r.author_role] ? (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{ROLE_LABELS[r.author_role]}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.replyMessage}>{r.message}</Text>
            </View>
          ))}
          {thread.replies.length === 0 && <Text style={styles.emptyText}>هنوز پاسخی داده نشده.</Text>}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.replyForm}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="پاسخ خود را بنویسید..."
          />
          <Button
            title={submitting ? 'در حال ارسال...' : 'ارسال'}
            onPress={handleReply}
            disabled={submitting || !message.trim()}
            style={styles.goldButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  container: { padding: 20, flexGrow: 1 },
  threadCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line + '14',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '900', color: colors.heading },
  meta: { fontSize: 12, color: colors.ink, opacity: 0.55, marginTop: 4 },
  body: { fontSize: 14, color: colors.ink, opacity: 0.85, marginTop: 12, lineHeight: 20 },
  repliesList: { gap: 10, marginBottom: 20 },
  replyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line + '14',
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  replyAuthor: { fontSize: 14, fontWeight: '700', color: colors.heading },
  roleBadge: { backgroundColor: colors.sage + '1a', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: colors.sage },
  replyMessage: { fontSize: 14, color: colors.ink, opacity: 0.85 },
  emptyText: { fontSize: 13, color: colors.ink, opacity: 0.55 },
  errorText: { color: colors.danger, fontSize: 13, marginBottom: 12 },
  replyForm: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line + '33',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
  },
  goldButton: { backgroundColor: colors.gold },
});
