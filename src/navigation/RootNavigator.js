import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { LoadingView } from '../components/UI';
import { colors } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import TestScreen from '../screens/TestScreen';
import PaymentStatusScreen from '../screens/PaymentStatusScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ForumListScreen from '../screens/ForumListScreen';
import ForumThreadScreen from '../screens/ForumThreadScreen';
import LiveClassScreen from '../screens/LiveClassScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';
import AdminStatsScreen from '../screens/AdminStatsScreen';

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.navy },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '800' },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...screenOptions,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.ink,
        tabBarIcon: ({ color, size }) => {
          const icon = { Home: '📚', Dashboard: '🧭', Leaderboard: '🏆' }[route.name] || '•';
          return <Text style={{ color, fontSize: size - 4 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'کورس‌ها', tabBarLabel: 'کورس‌ها' }} />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false, tabBarLabel: 'داشبورد' }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: 'لیدربورد', tabBarLabel: 'لیدربورد' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  return (
    <RootStack.Navigator screenOptions={screenOptions}>
      <RootStack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: 'جزئیات کورس' }} />
      <RootStack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={({ route }) => ({ title: route.params?.title || 'ویدیو' })}
      />
      <RootStack.Screen
        name="Test"
        component={TestScreen}
        options={({ route }) => ({ title: route.params?.title || 'آزمون' })}
      />
      <RootStack.Screen
        name="PaymentStatus"
        component={PaymentStatusScreen}
        options={{ title: 'وضعیت پرداخت' }}
      />
      <RootStack.Screen name="ForumList" component={ForumListScreen} options={{ title: 'پرسش و پاسخ' }} />
      <RootStack.Screen name="ForumThread" component={ForumThreadScreen} options={{ title: 'موضوع انجمن' }} />
      <RootStack.Screen name="LiveClass" component={LiveClassScreen} options={{ title: 'کلاس آنلاین زنده' }} />
    </RootStack.Navigator>
  );
}

function AdminNavigator() {
  return (
    <RootStack.Navigator screenOptions={screenOptions}>
      <RootStack.Screen name="AdminPanel" component={AdminPanelScreen} options={{ title: 'پنل مدیریت' }} />
      <RootStack.Screen name="AdminStats" component={AdminStatsScreen} options={{ title: 'آمار و گزارش‌گیری' }} />
    </RootStack.Navigator>
  );
}

export default function RootNavigator() {
  const { token, user, loading } = useAuth();

  if (loading) return <LoadingView />;

  if (!token) return <NavigationContainer><AuthNavigator /></NavigationContainer>;

  return <NavigationContainer>{user?.role === 'admin' ? <AdminNavigator /> : <AppNavigator />}</NavigationContainer>;
}
