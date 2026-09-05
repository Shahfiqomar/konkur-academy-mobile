import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ErrorView, LoadingView } from '../components/UI';
import { colors } from '../theme';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardScreen() {
  const { token } = useAuth();
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getBranches().then(setBranches).catch(() => {});
  }, []);

  const load = useCallback(() => {
    return api
      .getLeaderboard(branchId || null, token)
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, [branchId, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (error && !data) return <ErrorView message={error} />;
  if (!data) return <LoadingView />;

  return (
    <FlatList
      data={data.rows}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>لیدربورد شاگردان</Text>
          <Text style={styles.subtitle}>امتیاز از آزمون‌های آنلاین به‌دست می‌آید — هر پاسخ درست ۱۰ امتیاز.</Text>

          <View style={styles.pickerWrap}>
            <Picker selectedValue={branchId} onValueChange={setBranchId}>
              <Picker.Item label="همه رشته‌ها" value="" />
              {branches.map((b) => (
                <Picker.Item key={b.id} label={b.title} value={String(b.id)} />
              ))}
            </Picker>
          </View>

          {data.myRank ? <Text style={styles.myRank}>رتبه شما: {data.myRank}</Text> : null}
        </View>
      }
      ListEmptyComponent={<Text style={styles.emptyText}>هنوز امتیازی ثبت نشده.</Text>}
      renderItem={({ item, index }) => (
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.medal}>{MEDALS[index] || index + 1}</Text>
            <View>
              <Text style={styles.name}>{item.full_name}</Text>
              {item.branch_title ? <Text style={styles.branch}>{item.branch_title}</Text> : null}
            </View>
          </View>
          <Text style={styles.points}>{item.points}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 20, backgroundColor: colors.paper, flexGrow: 1 },
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '900', color: colors.heading, marginBottom: 4 },
  subtitle: { fontSize: 12, color: colors.ink, opacity: 0.6, marginBottom: 14 },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.line + '33',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  myRank: { fontSize: 13, fontWeight: '700', color: colors.sage },
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
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medal: { width: 28, textAlign: 'center', fontSize: 16, fontWeight: '800', color: colors.heading },
  name: { fontSize: 14, fontWeight: '700', color: colors.heading },
  branch: { fontSize: 11, color: colors.ink, opacity: 0.55, marginTop: 2 },
  points: { fontSize: 16, fontWeight: '900', color: colors.gold },
  emptyText: { fontSize: 13, color: colors.ink, opacity: 0.55, textAlign: 'center', marginTop: 20 },
});
