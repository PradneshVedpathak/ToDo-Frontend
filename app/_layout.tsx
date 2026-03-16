import { useEffect } from 'react';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { TodoProvider } from '../src/context/TodoContext';
import { registerForPushNotifications, setupWebPush } from '../src/utils/notifications';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    if (Platform.OS !== 'web') {
      registerForPushNotifications();
    } else {
      setupWebPush();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TodoProvider>
          <Head>
            <title>DoIt | Mission Control</title>
            <meta name="description" content="Ultra-premium todo application for mission-critical objectives." />
          </Head>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
        </TodoProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
