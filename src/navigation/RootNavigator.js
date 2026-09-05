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
        tabBarIcon: ({ color, size }) => (
          <Text style={{ color, fontSize: size - 4 }}>{route.name === 'Home' ? '📚' : '🧭'}</Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'کورس‌ها', tabBarLabel: 'کورس‌ها' }} />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false, tabBarLabel: 'داشبورد' }}
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
    </RootStack.Navigator>
  );
}

export default function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) return <LoadingView />;

  return <NavigationContainer>{token ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
