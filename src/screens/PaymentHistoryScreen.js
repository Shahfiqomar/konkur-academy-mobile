import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ErrorView, LoadingView } from '../components/UI';
import { colors } from '../theme';

const STATUS_LABELS = { pending: 'در انتظار تایید', success: 'موفق', failed: 'ناموفق' };
const STATUS_STYLES = {
  pending: { backgroundColor: '#FEF3C7', color: '#B45309' },
  success: { backgroundColor: colors.sage + '1a', color: colors.sage },
  failed: { backgroundColor: colors.dangerBg, color: colors.danger },
};

export default function PaymentHistoryScreen({ navigation }) {
  const { token } = useAuth();
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    return api
      .getPaymentHistory(token)
      .then((p) => {
        setPayments(p);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (error && !payments) return <ErrorView message={error} />;
  if (!payments) return <LoadingView />;

  return (
    <FlatList
      data={payments}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.emptyText}>هنوز پرداختی ثبت نشده.</Text>}
      renderItem={({ item }) => {
        const statusStyle = STATUS_STYLES[item.status] || {};
        return (
          <Pressable style={styles.row} onPress={() => navigation.navigate('PaymentStatus', { paymentId: item.id })}>
            <View style={styles.flex1}>
              <Text style={styles.courseTitle}>{item.course_title}</Text>
              <Text style={styles.meta}>
                {item.amount} {item.currency === 'AFN' ? 'افغانی' : item.currency} ·{' '}
                {item.method === 'card' ? 'کارت' : 'حواله بانکی'}
              </Text>
              <Text style={styles.date}>{item.created_at}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.color }]}>
                {STATUS_LABELS[item.status] || item.status}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, backgroundColor: colors.paper, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line + '14',
    marginBottom: 8,
    gap: 10,
  },
  flex1: { flex: 1 },
  courseTitle: { fontSize: 14, fontWeight: '700', color: colors.heading },
  meta: { fontSize: 11, color: colors.ink, opacity: 0.6, marginTop: 4 },
  date: { fontSize: 10, color: colors.ink, opacity: 0.45, marginTop: 4 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '700' },
  emptyText: { fontSize: 13, color: colors.ink, opacity: 0.55, textAlign: 'center', marginTop: 20 },
});
