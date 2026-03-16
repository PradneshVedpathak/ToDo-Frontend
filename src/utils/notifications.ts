import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { api } from './api';

// expo-notifications does not support web — only import and configure on native
if (Platform.OS !== 'web') {
  // Dynamic require so the module isn't even evaluated on web
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) return null;

  const Notifications = require('expo-notifications');

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'DoIt Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C63FF',
    });
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Date
) {
  if (Platform.OS === 'web') return;
  if (trigger <= new Date()) return;

  const Notifications = require('expo-notifications');
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
    } as any,
  });
}

export async function cancelAllScheduled() {
  if (Platform.OS === 'web') return;
  const Notifications = require('expo-notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function setupWebPush() {
  if (Platform.OS !== 'web') return;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const { key } = await api.getVapidKey();
    if (!key) return;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });

    await api.subscribePush(sub.toJSON());
  } catch {
    // Fail silently in production
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}
