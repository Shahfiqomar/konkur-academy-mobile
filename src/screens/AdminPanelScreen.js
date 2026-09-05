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
import { Picker } from '@react-native-picker/picker';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/UI';
import { colors } from '../theme';

const emptyQuestion = () => ({ question_text: '', options: ['', '', '', ''], correct_index: 0 });

export default function AdminPanelScreen({ navigation }) {
  const { token, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [msg, setMsg] = useState('');
  const [paymentMsg, setPaymentMsg] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(null);

  const [branchForm, setBranchForm] = useState({ title: '' });
  const [teacherForm, setTeacherForm] = useState({ full_name: '', email: '', password: '' });
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    subject: '',
    price: '0',
    price_usd: '',
    branch_id: '',
    teacher_id: '',
  });
  const [testForm, setTestForm] = useState({ course_id: '', title: '', questions: [emptyQuestion()] });

  const loadPendingPayments = useCallback(() => {
    api
      .getPendingPayments(token)
      .then(setPendingPayments)
      .catch(() => setPendingPayments([]));
  }, [token]);

  const loadAll = useCallback(() => {
    api.getCourses().then(setCourses).catch(() => {});
    api.getBranches().then(setBranches).catch(() => {});
    api.getTeachers(token).then(setTeachers).catch(() => {});
    loadPendingPayments();
  }, [token, loadPendingPayments]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  async function submitBranch() {
    setMsg('');
    if (!branchForm.title.trim()) return;
    try {
      await api.createBranch(branchForm, token);
      setMsg('✓ رشته/صنف ساخته شد.');
      setBranchForm({ title: '' });
      loadAll();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function submitTeacher() {
    setMsg('');
    try {
      await api.createTeacher(teacherForm, token);
      setMsg('✓ حساب استاد ساخته شد.');
      setTeacherForm({ full_name: '', email: '', password: '' });
      loadAll();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function submitCourse() {
    setMsg('');
    try {
      await api.createCourse(
        {
          ...courseForm,
          price: Number(courseForm.price) || 0,
          price_usd: courseForm.price_usd === '' ? undefined : Number(courseForm.price_usd),
        },
        token
      );
      setMsg('✓ کورس ساخته شد.');
      setCourseForm({
        title: '',
        description: '',
        subject: '',
        price: '0',
        price_usd: '',
        branch_id: '',
        teacher_id: '',
      });
      loadAll();
    } catch (err) {
      setMsg(err.message);
    }
  }

  async function submitTest() {
    setMsg('');
    try {
      await api.createTest(testForm, token);
      setMsg('✓ آزمون ساخته شد.');
      setTestForm({ course_id: '', title: '', questions: [emptyQuestion()] });
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

  async function approvePayment(paymentId) {
    setPaymentLoading(paymentId);
    setPaymentMsg('');
    try {
      await api.approvePayment(paymentId, token);
      setPaymentMsg('پرداخت تایید شد.');
      loadPendingPayments();
    } catch (err) {
      setPaymentMsg(err.message);
    } finally {
      setPaymentLoading(null);
    }
  }

  async function rejectPayment(paymentId) {
    setPaymentLoading(paymentId);
    setPaymentMsg('');
    try {
      await api.rejectPayment(paymentId, token);
      setPaymentMsg('پرداخت رد شد.');
      loadPendingPayments();
    } catch (err) {
      setPaymentMsg(err.message);
    } finally {
      setPaymentLoading(null);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Text style={styles.title}>پنل مدیریت آموزشگاه</Text>
          <Pressable onPress={logout}>
            <Text style={styles.logout}>خروج</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('AdminStats')} style={styles.statsLink}>
          <Text style={styles.statsLinkText}>📊 آمار و گزارش‌گیری</Text>
        </Pressable>

        {msg ? <Text style={styles.successMsg}>{msg}</Text> : null}
        {paymentMsg ? <Text style={styles.paymentMsg}>{paymentMsg}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>پرداخت‌های در انتظار</Text>
          {pendingPayments.length === 0 ? (
            <Text style={styles.hintText}>پرداخت در انتظار وجود ندارد.</Text>
          ) : (
            <View style={styles.listGap}>
              {pendingPayments.map((p) => (
                <View key={p.id} style={styles.paymentRow}>
                  <Text style={styles.paymentCourse}>{p.course_title}</Text>
                  <Text style={styles.paymentMeta}>
                    کاربر: {p.user_name} ({p.user_email})
                  </Text>
                  <Text style={styles.paymentMeta}>
                    مبلغ: {p.amount} {p.currency === 'AFN' ? 'افغانی' : p.currency} ({p.method === 'card' ? 'کارت' : 'حواله بانکی'})
                  </Text>
                  <View style={styles.paymentActions}>
                    <Button
                      title="تایید"
                      onPress={() => approvePayment(p.id)}
                      disabled={paymentLoading === p.id}
                      style={styles.approveButton}
                    />
                    <Button
                      title="رد"
                      onPress={() => rejectPayment(p.id)}
                      disabled={paymentLoading === p.id}
                      style={styles.rejectButton}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>افزودن رشته/صنف جدید</Text>
          <TextInput
            style={styles.input}
            placeholder="عنوان رشته (مثلاً طب)"
            value={branchForm.title}
            onChangeText={(v) => setBranchForm({ title: v })}
          />
          <Button title="ساخت رشته" onPress={submitBranch} style={styles.actionButton} />
          <View style={styles.chipRow}>
            {branches.map((b) => (
              <View key={b.id} style={styles.chip}>
                <Text style={styles.chipText}>{b.title}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>افزودن حساب استاد جدید</Text>
          <TextInput
            style={styles.input}
            placeholder="نام کامل استاد"
            value={teacherForm.full_name}
            onChangeText={(v) => setTeacherForm({ ...teacherForm, full_name: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="ایمیل"
            autoCapitalize="none"
            keyboardType="email-address"
            value={teacherForm.email}
            onChangeText={(v) => setTeacherForm({ ...teacherForm, email: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="رمز عبور موقت"
            secureTextEntry
            value={teacherForm.password}
            onChangeText={(v) => setTeacherForm({ ...teacherForm, password: v })}
          />
          <Button title="ساخت حساب استاد" onPress={submitTeacher} style={styles.actionButton} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>افزودن کورس جدید</Text>
          <TextInput
            style={styles.input}
            placeholder="عنوان کورس"
            value={courseForm.title}
            onChangeText={(v) => setCourseForm({ ...courseForm, title: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="موضوع (مثلاً ریاضی)"
            value={courseForm.subject}
            onChangeText={(v) => setCourseForm({ ...courseForm, subject: v })}
          />
          <Text style={styles.label}>رشته</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={courseForm.branch_id}
              onValueChange={(v) => setCourseForm({ ...courseForm, branch_id: v })}
            >
              <Picker.Item label="بدون رشته" value="" />
              {branches.map((b) => (
                <Picker.Item key={b.id} label={b.title} value={String(b.id)} />
              ))}
            </Picker>
          </View>
          <Text style={styles.label}>استاد</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={courseForm.teacher_id}
              onValueChange={(v) => setCourseForm({ ...courseForm, teacher_id: v })}
            >
              <Picker.Item label="بدون استاد" value="" />
              {teachers.map((t) => (
                <Picker.Item key={t.id} label={t.full_name} value={String(t.id)} />
              ))}
            </Picker>
          </View>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="توضیحات"
            multiline
            value={courseForm.description}
            onChangeText={(v) => setCourseForm({ ...courseForm, description: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="قیمت به افغانی (۰ برای رایگان)"
            keyboardType="numeric"
            value={String(courseForm.price)}
            onChangeText={(v) => setCourseForm({ ...courseForm, price: v })}
          />
          <TextInput
            style={styles.input}
            placeholder="قیمت به دالر برای کارت (اختیاری)"
            keyboardType="numeric"
            value={courseForm.price_usd}
            onChangeText={(v) => setCourseForm({ ...courseForm, price_usd: v })}
          />
          <Text style={styles.hintText}>
            اگر قیمت دلاری خالی بماند، پرداخت با کارت (Stripe) برای این کورس غیرفعال می‌ماند و فقط حواله بانکی در دسترس است.
          </Text>
          <Button title="ساخت کورس" onPress={submitCourse} style={styles.actionButton} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>ساخت آزمون</Text>
          <Text style={styles.label}>کورس</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={testForm.course_id}
              onValueChange={(v) => setTestForm({ ...testForm, course_id: v })}
            >
              <Picker.Item label="انتخاب کورس..." value="" />
              {courses.map((c) => (
                <Picker.Item key={c.id} label={c.title} value={String(c.id)} />
              ))}
            </Picker>
          </View>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  container: { padding: 20, flexGrow: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '900', color: colors.heading, flexShrink: 1 },
  logout: { fontSize: 13, fontWeight: '700', color: colors.danger, marginTop: 4 },
  statsLink: {
    alignSelf: 'flex-start',
    backgroundColor: colors.navy,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 10,
  },
  statsLinkText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  successMsg: { color: colors.sage, fontWeight: '700', fontSize: 13, marginTop: 8 },
  paymentMsg: { color: colors.danger, fontWeight: '700', fontSize: 13, marginTop: 8 },
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
  label: { fontSize: 12, fontWeight: '700', color: colors.heading, marginTop: 4 },
  hintText: { fontSize: 11, color: colors.ink, opacity: 0.55 },
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
  textarea: { height: 70, textAlignVertical: 'top' },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.line + '33',
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionButton: { marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { backgroundColor: colors.line + '0d', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 11, fontWeight: '700', color: colors.heading },
  paymentRow: {
    borderWidth: 1,
    borderColor: colors.line + '14',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  paymentCourse: { fontSize: 13, fontWeight: '800', color: colors.heading },
  paymentMeta: { fontSize: 11, color: colors.ink, opacity: 0.6 },
  paymentActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  approveButton: { flex: 1, backgroundColor: colors.sage, paddingVertical: 9 },
  rejectButton: { flex: 1, backgroundColor: colors.danger, paddingVertical: 9 },
  listGap: { gap: 10 },
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
