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
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Button } from '../components/UI';
import { colors } from '../theme';

const STATUS_LABELS = { paid: 'پرداخت‌شده', free: 'رایگان', pending: 'در انتظار' };
const emptyQuestion = () => ({ question_text: '', options: ['', '', '', ''], correct_index: 0 });

export default function TeacherPanelScreen({ navigation }) {
  const { token, user, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [msg, setMsg] = useState('');

  const [courseForm, setCourseForm] = useState({ title: '', subject: '', price: '0' });
  const [testForm, setTestForm] = useState({ title: '', questions: [emptyQuestion()] });

  const loadCourses = useCallback(() => {
    api.getMyCourses(token).then(setCourses).catch(() => {});
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadCourses();
    }, [loadCourses])
  );

  function openCourse(c) {
    setSelectedCourse(c);
    api.getCourseStudents(c.id, token).then(setStudents).catch(() => {});
  }

  async function submitCourse() {
    setMsg('');
    if (!courseForm.title.trim()) return;
    try {
      await api.createCourse({ ...courseForm, price: Number(courseForm.price) || 0 }, token);
      setMsg('✓ کورس ساخته شد.');
      setCourseForm({ title: '', subject: '', price: '0' });
      loadCourses();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function submitTest() {
    setMsg('');
    if (!selectedCourse) return;
    try {
      await api.createTest({ course_id: selectedCourse.id, ...testForm }, token);
      setMsg('✓ آزمون ساخته شد.');
      setTestForm({ title: '', questions: [emptyQuestion()] });
    } catch (err) {
      setMsg(err.message);
    }
  }

  function updateQuestion(idx, field, value) {
    setTestForm((prev) => {
      const questions = [...prev.questions];
      questions[idx] = { ...questions[idx], [field]: value };
      return { ...prev, questions };
    });
  }
  function updateOption(qIdx, oIdx, value) {
    setTestForm((prev) => {
      const questions = [...prev.questions];
      const options = [...questions[qIdx].options];
      options[oIdx] = value;
      questions[qIdx] = { ...questions[qIdx], options };
      return { ...prev, questions };
    });
  }
  function addQuestion() {
    setTestForm((prev) => ({ ...prev, questions: [...prev.questions, emptyQuestion()] }));
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>پنل استاد</Text>
            <Text style={styles.subtitle}>خوش آمدید {user?.full_name}</Text>
          </View>
          <Pressable onPress={logout}>
            <Text style={styles.logout}>خروج</Text>
          </Pressable>
        </View>

        {msg ? <Text style={styles.successMsg}>{msg}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>کورس‌های من</Text>
          <View style={styles.listGap}>
            {courses.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => openCourse(c)}
                style={[styles.courseRow, selectedCourse?.id === c.id && styles.courseRowSelected]}
              >
                <Text style={styles.courseTitle}>{c.title}</Text>
                <Text style={styles.courseSubject}>{c.subject}</Text>
              </Pressable>
            ))}
            {courses.length === 0 && <Text style={styles.hintText}>هنوز کورسی ندارید.</Text>}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>افزودن کورس جدید</Text>
          <TextInput
            style={styles.input}
            placeholder="عنوان"
            value={courseForm.title}
            onChangeText={(v) => setCourseForm({ ...courseForm, title: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="موضوع"
            value={courseForm.subject}
            onChangeText={(v) => setCourseForm({ ...courseForm, subject: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="قیمت"
            keyboardType="numeric"
            value={String(courseForm.price)}
            onChangeText={(v) => setCourseForm({ ...courseForm, price: v })}
          />
          <Button title="ساخت کورس" onPress={submitCourse} style={styles.actionButton} />
        </View>

        {!selectedCourse && (
          <View style={styles.card}>
            <Text style={styles.hintText}>
              یک کورس را از فهرست بالا انتخاب کنید تا شاگردان و آزمون آن را مدیریت کنید.
            </Text>
          </View>
        )}

        {selectedCourse && (
          <>
            <View style={styles.linkRow}>
              <Button
                title="🎥 کلاس آنلاین زنده"
                onPress={() => navigation.navigate('LiveClass', { courseId: selectedCourse.id })}
                variant="secondary"
                style={styles.linkButton}
              />
              <Button
                title="💬 پرسش و پاسخ"
                onPress={() => navigation.navigate('ForumList', { courseId: selectedCourse.id })}
                variant="secondary"
                style={styles.linkButton}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>شاگردان ثبت‌نام‌شده ({students.length})</Text>
              <View style={styles.listGap}>
                {students.map((s) => (
                  <View key={s.id} style={styles.studentRow}>
                    <View style={styles.flex1}>
                      <Text style={styles.studentName}>{s.full_name}</Text>
                      <Text style={styles.studentEmail}>{s.email}</Text>
                    </View>
                    <View style={[styles.statusBadge, s.payment_status === 'pending' && styles.statusBadgePending]}>
                      <Text
                        style={[
                          styles.statusBadgeText,
                          s.payment_status === 'pending' && styles.statusBadgeTextPending,
                        ]}
                      >
                        {STATUS_LABELS[s.payment_status] || s.payment_status}
                      </Text>
                    </View>
                  </View>
                ))}
                {students.length === 0 && <Text style={styles.hintText}>هنوز شاگردی ثبت‌نام نکرده.</Text>}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>ساخت آزمون</Text>
              <TextInput
                style={styles.input}
                placeholder="عنوان آزمون"
                value={testForm.title}
                onChangeText={(v) => setTestForm({ ...testForm, title: v })}
              />
              {testForm.questions.map((q, qi) => (
                <View key={qi} style={styles.questionCard}>
                  <TextInput
                    style={styles.input}
                    placeholder={`سوال ${qi + 1}`}
                    value={q.question_text}
                    onChangeText={(v) => updateQuestion(qi, 'question_text', v)}
                  />
                  {q.options.map((opt, oi) => {
                    const selected = q.correct_index === oi;
                    return (
                      <Pressable
                        key={oi}
                        onPress={() => updateQuestion(qi, 'correct_index', oi)}
                        style={styles.optionRow}
                      >
                        <View style={[styles.radio, selected && styles.radioSelected]} />
                        <TextInput
                          style={[styles.input, styles.optionInput]}
                          placeholder={`گزینه ${oi + 1}`}
                          value={opt}
                          onChangeText={(v) => updateOption(qi, oi, v)}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              ))}
              <Pressable onPress={addQuestion}>
                <Text style={styles.addQuestionLink}>+ افزودن سوال دیگر</Text>
              </Pressable>
              <Button title="ساخت آزمون" onPress={submitTest} style={styles.actionButton} />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  container: { padding: 20, flexGrow: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '900', color: colors.heading },
  subtitle: { fontSize: 13, color: colors.ink, opacity: 0.6, marginTop: 4 },
  logout: { fontSize: 13, fontWeight: '700', color: colors.danger, marginTop: 4 },
  successMsg: { color: colors.sage, fontWeight: '700', fontSize: 13, marginTop: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line + '14',
    marginTop: 16,
    gap: 8,
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.heading, marginBottom: 4 },
  hintText: { fontSize: 12, color: colors.ink, opacity: 0.55 },
  listGap: { gap: 8 },
  courseRow: {
    borderWidth: 1,
    borderColor: colors.line + '14',
    borderRadius: 10,
    padding: 12,
  },
  courseRowSelected: { borderColor: colors.gold },
  courseTitle: { fontSize: 14, fontWeight: '700', color: colors.heading },
  courseSubject: { fontSize: 11, color: colors.ink, opacity: 0.55, marginTop: 2 },
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
  actionButton: { marginTop: 4 },
  linkRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  linkButton: { flex: 1 },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line + '0d',
    paddingBottom: 8,
  },
  flex1: { flex: 1 },
  studentName: { fontSize: 13, fontWeight: '700', color: colors.heading },
  studentEmail: { fontSize: 11, color: colors.ink, opacity: 0.55, marginTop: 2 },
  statusBadge: { backgroundColor: colors.sage + '1a', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgePending: { backgroundColor: colors.dangerBg },
  statusBadgeText: { fontSize: 11, fontWeight: '700', color: colors.sage },
  statusBadgeTextPending: { color: colors.danger },
  questionCard: {
    borderWidth: 1,
    borderColor: colors.line + '1a',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.line + '55',
  },
  radioSelected: { borderColor: colors.gold, backgroundColor: colors.gold },
  optionInput: { flex: 1 },
  addQuestionLink: { fontSize: 13, fontWeight: '700', color: colors.gold, marginTop: 4 },
});
