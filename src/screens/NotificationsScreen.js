import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ErrorView, LoadingView } from '../components/UI';
import { colors } from '../theme';

const TYPE_ICONS = {
  forum: '💬',
  test: '📝',
  live: '🎥',
  payment: '💳',
};

export default function NotificationsScreen() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    return api
      .getNotifications(token)
      .then((d) => {
        setData(d);
        setError('');
        if (d.unreadCount > 0) {
          api.markNotificationsRead(token).catch(() => {});
        }
      })
      .catch((e) => setError(e.message));
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (error && !data) return <ErrorView message={error} />;
  if (!data) return <LoadingView />;

  return (
    <FlatList
      data={data.items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.emptyText}>هنوز اعلانی ندارید.</Text>}
      renderItem={({ item }) => (
        <View style={[styles.row, !item.is_read && styles.rowUnread]}>
          <Text style={styles.icon}>{TYPE_ICONS[item.type] || '🔔'}</Text>
          <View style={styles.flex1}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.meta}>{new Date(item.created_at).toLocaleString('fa-IR')}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, backgroundColor: colors.paper, flexGrow: 1, gap: 8 },
  row: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line + '14',
    marginBottom: 8,
  },
  rowUnread: { borderColor: colors.gold + '55', backgroundColor: colors.gold + '0d' },
  icon: { fontSize: 20 },
  flex1: { flex: 1 },
  title: { fontSize: 14, fontWeight: '800', color: colors.heading },
  message: { fontSize: 13, color: colors.ink, opacity: 0.8, marginTop: 2 },
  meta: { fontSize: 11, color: colors.ink, opacity: 0.5, marginTop: 6 },
  emptyText: { fontSize: 13, color: colors.ink, opacity: 0.55, textAlign: 'center', marginTop: 20 },
});
