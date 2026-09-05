import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorView, LoadingView } from '../components/UI';
import { colors } from '../theme';

export default function ForumListScreen({ route, navigation }) {
  const { courseId } = route.params;
  const { token } = useAuth();
  const [threads, setThreads] = useState(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    return api
      .getThreads(courseId, token)
      .then((t) => {
        setThreads(t);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [courseId, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSubmit() {
    if (!title.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.createThread(courseId, { title, body }, token);
      setTitle('');
      setBody('');
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !threads) return <ErrorView message={error} />;
  if (!threads) return <LoadingView />;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={threads}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>سوال جدید بپرسید</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="عنوان سوال"
            />
            <TextInput
              style={[styles.input, styles.textarea]}
              value={body}
              onChangeText={setBody}
              placeholder="توضیح بیشتر (اختیاری)"
              multiline
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button
              title={submitting ? 'در حال ارسال...' : 'ارسال سوال'}
              onPress={handleSubmit}
              disabled={submitting || !title.trim()}
              style={styles.submitButton}
            />
          </View>
        }
        ListEmptyComponent={<Text style={styles.emptyText}>هنوز سوالی پرسیده نشده.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate('ForumThread', { threadId: item.id })}
          >
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowMeta}>
              پرسیده شده توسط {item.author_name} · {item.reply_count} پاسخ
            </Text>
          </Pressable>
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  list: { padding: 20, flexGrow: 1 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line + '14',
    marginBottom: 16,
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
  textarea: { height: 80, textAlignVertical: 'top' },
  errorText: { color: colors.danger, fontSize: 13 },
  submitButton: { marginTop: 4 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line + '14',
    marginBottom: 8,
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.heading },
  rowMeta: { fontSize: 12, color: colors.ink, opacity: 0.55, marginTop: 4 },
  emptyText: { fontSize: 13, color: colors.ink, opacity: 0.55, textAlign: 'center', marginTop: 20 },
});
