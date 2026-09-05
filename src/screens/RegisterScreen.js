import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/UI';
import { colors } from '../theme';

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getBranches().then(setBranches).catch(() => {});
  }, []);

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.register({
        full_name: fullName,
        email,
        password,
        branch_id: branchId || undefined,
      });
      await login(token, user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = fullName.trim() && email.trim() && password.length >= 6;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>ثبت‌نام شاگرد جدید</Text>
        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>نام کامل</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

          <Text style={styles.label}>ایمیل</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>رمز عبور</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
          <Text style={styles.hint}>حداقل ۶ حرف</Text>

          <Text style={styles.label}>رشته/صنف شما</Text>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={branchId} onValueChange={setBranchId}>
              <Picker.Item label="انتخاب نشده" value="" />
              {branches.map((b) => (
                <Picker.Item key={b.id} label={b.title} value={String(b.id)} />
              ))}
            </Picker>
          </View>

          <Button
            title={loading ? 'در حال ثبت‌نام...' : 'ساخت حساب'}
            onPress={handleSubmit}
            disabled={loading || !canSubmit}
            style={styles.submitButton}
          />
        </View>

        <Text style={styles.footerText}>
          قبلاً ثبت‌نام کرده‌اید؟{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Login')}>
            وارد شوید
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.paper },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '900', color: colors.heading, textAlign: 'center', marginBottom: 24 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.heading, marginBottom: 6, marginTop: 12 },
  hint: { fontSize: 11, color: colors.ink, opacity: 0.6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.line + '33',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.line + '33',
    borderRadius: 10,
    overflow: 'hidden',
  },
  submitButton: { marginTop: 20, backgroundColor: colors.gold },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 8,
  },
  footerText: { textAlign: 'center', marginTop: 20, color: colors.ink },
  link: { color: colors.gold, fontWeight: '700' },
});
