import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ErrorView, LoadingView } from '../components/UI';
import { colors } from '../theme';

const STATUS_LABELS = { pending: 'در انتظار تایید', success: 'موفق', failed: 'ناموفق' };

export default function PaymentStatusScreen({ route }) {
  const { paymentId } = route.params;
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return api
      .getPaymentStatus(paymentId, token)
      .then((res) => {
        setStatus(res);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [paymentId, token]);

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

  if (error && !status) return <ErrorView message={error} />;
  if (!status) return <LoadingView />;

  const statusLabel = STATUS_LABELS[status.status] || status.status;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>وضعیت پرداخت</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>شناسه پرداخت</Text>
          <Text style={styles.value}>{status.paymentRef}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>وضعیت</Text>
          <Text style={styles.value}>{statusLabel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>مبلغ</Text>
          <Text style={styles.value}>
            {status.amount} {status.currency === 'AFN' ? 'افغانی' : status.currency}
          </Text>
        </View>
        {status.confirmedAt ? (
          <View style={styles.row}>
            <Text style={styles.label}>زمان تایید</Text>
            <Text style={styles.value}>{status.confirmedAt}</Text>
          </View>
        ) : null}

        {status.status === 'pending' && (
          <Text style={styles.hintText}>پرداخت شما هنوز تایید نشده است. برای بررسی دوباره، این صفحه را پایین بکشید.</Text>
        )}
        {status.status === 'success' && (
          <Text style={styles.successText}>پرداخت تایید شد و دسترسی به کورس فعال شده است.</Text>
        )}
        {status.status === 'failed' && (
          <Text style={styles.failedText}>پرداخت ناموفق بود. در صورت نیاز با پشتیبانی تماس بگیرید.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.paper, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '900', color: colors.heading, marginBottom: 18 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.line + '14',
  },
  row: { gap: 3 },
  label: { fontSize: 12, color: colors.ink, opacity: 0.6 },
  value: { fontSize: 15, fontWeight: '800', color: colors.heading },
  hintText: { fontSize: 13, color: colors.ink, opacity: 0.7, marginTop: 6 },
  successText: { fontSize: 13, color: colors.sage, fontWeight: '700', marginTop: 6 },
  failedText: { fontSize: 13, color: colors.danger, fontWeight: '700', marginTop: 6 },
});
