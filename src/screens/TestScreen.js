import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button, ErrorView, LoadingView } from '../components/UI';
import { colors } from '../theme';

export default function TestScreen({ route }) {
  const { testId } = route.params;
  const { token } = useAuth();
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getTest(testId, token).then(setTest).catch((e) => setError(e.message));
  }, [testId, token]);

  function selectAnswer(questionId, optionIndex) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        answers: Object.entries(answers).map(([question_id, selected_index]) => ({
          question_id: Number(question_id),
          selected_index,
        })),
      };
      const res = await api.submitTest(testId, payload, token);
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !test) return <ErrorView message={error} />;
  if (!test) return <LoadingView />;

  if (result) {
    const percent = Math.round((result.score / result.total) * 100);
    return (
      <View style={styles.resultContainer}>
        <View style={styles.resultCircle}>
          <Text style={styles.resultPercent}>{percent}%</Text>
        </View>
        <Text style={styles.resultTitle}>آزمون تمام شد!</Text>
        <Text style={styles.resultScore}>
          {result.score} از {result.total} پاسخ درست
        </Text>
      </View>
    );
  }

  const allAnswered = test.questions.every((q) => answers[q.id] !== undefined);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{test.title}</Text>
      <View style={styles.questionList}>
        {test.questions.map((q, qi) => (
          <View key={q.id} style={styles.questionCard}>
            <Text style={styles.questionText}>
              {qi + 1}. {q.question_text}
            </Text>
            <View style={styles.optionsList}>
              {q.options.map((opt, oi) => {
                const selected = answers[q.id] === oi;
                return (
                  <Pressable
                    key={oi}
                    onPress={() => selectAnswer(q.id, oi)}
                    style={[styles.option, selected && styles.optionSelected]}
                  >
                    <View style={[styles.radio, selected && styles.radioSelected]} />
                    <Text style={styles.optionText}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button
        title={submitting ? 'در حال ارسال...' : 'ارسال پاسخ‌ها'}
        onPress={handleSubmit}
        disabled={!allAnswered || submitting}
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.paper, flexGrow: 1 },
  title: { fontSize: 20, fontWeight: '900', color: colors.heading, marginBottom: 18 },
  questionList: { gap: 16 },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line + '14',
  },
  questionText: { fontSize: 14, fontWeight: '700', color: colors.heading, marginBottom: 10 },
  optionsList: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line + '1a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optionSelected: { borderColor: colors.gold, backgroundColor: colors.gold + '1a' },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.line + '55',
  },
  radioSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  optionText: { fontSize: 13, color: colors.ink, flexShrink: 1 },
  errorText: { color: colors.danger, fontSize: 13, marginTop: 12 },
  submitButton: { marginTop: 24 },
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.paper },
  resultCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.sage + '1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultPercent: { fontSize: 26, fontWeight: '900', color: colors.sage },
  resultTitle: { fontSize: 22, fontWeight: '900', color: colors.heading },
  resultScore: { fontSize: 15, color: colors.ink, opacity: 0.75, marginTop: 8 },
});
