import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/UI';
import { colors } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login({ email, password });
      await login(token, user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>ورود به حساب</Text>
        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>ایمیل</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />

          <Text style={styles.label}>رمز عبور</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <Button
            title={loading ? 'در حال ورود...' : 'ورود'}
            onPress={handleSubmit}
            disabled={loading || !email || !password}
            style={styles.submitButton}
          />
        </View>

        <Text style={styles.footerText}>
          حساب ندارید؟{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Register')}>
            ثبت‌نام کنید
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
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 4 },
  label: { fontSize: 13, fontWeight: '700', color: colors.heading, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.line + '33',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
  },
  submitButton: { marginTop: 20 },
  error: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 8,
    fontSize: 13,
  },
  footerText: { textAlign: 'center', marginTop: 20, color: colors.ink },
  link: { color: colors.gold, fontWeight: '700' },
});
