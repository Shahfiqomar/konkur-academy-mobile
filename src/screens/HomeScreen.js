import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import { LoadingView, ErrorView } from '../components/UI';
import { colors } from '../theme';

export default function HomeScreen({ navigation }) {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return api
      .getCourses()
      .then((data) => {
        setCourses(data);
        setError('');
      })
      .catch((e) => setError(e.message));
  }, []);

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

  if (error && !courses) return <ErrorView message={error} />;
  if (!courses) return <LoadingView />;

  return (
    <FlatList
      data={courses}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.hero}>
          <Text style={styles.heroTag}>آموزشگاه آنلاین کانکور</Text>
          <Text style={styles.heroTitle}>هر شاگرد یک مسیر دارد،{'\n'}این مسیر تا روز کانکور است</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>هنوز کورسی اضافه نشده.</Text>}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
        >
          <View style={[styles.coverBar, { backgroundColor: item.cover_color || colors.navy }]} />
          <View style={styles.cardBody}>
            <Text style={styles.subject}>{item.subject}</Text>
            <Text style={styles.courseTitle}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
            <Text style={styles.price}>{item.price === 0 ? 'رایگان' : `${item.price} افغانی`}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, backgroundColor: colors.paper, flexGrow: 1 },
  hero: { paddingVertical: 12, marginBottom: 8 },
  heroTag: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: colors.sage,
    backgroundColor: colors.sage + '1a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
    overflow: 'hidden',
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: colors.heading, lineHeight: 30 },
  empty: { textAlign: 'center', color: colors.ink, opacity: 0.6, marginTop: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line + '14',
  },
  cardPressed: { opacity: 0.85 },
  coverBar: { height: 6 },
  cardBody: { padding: 16 },
  subject: { fontSize: 12, fontWeight: '700', color: colors.sage, marginBottom: 4 },
  courseTitle: { fontSize: 17, fontWeight: '800', color: colors.heading },
  description: { fontSize: 13, color: colors.ink, opacity: 0.7, marginTop: 4 },
  price: { fontSize: 15, fontWeight: '800', color: colors.heading, marginTop: 10 },
});
