import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getClient } from '../api/data';
import { getCurrentUser } from 'aws-amplify/auth';

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request push notification permissions and register device token
 * @returns The Expo push token if successful, null otherwise
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    // Set notification channel for Android
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // Check and request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Failed to get push token for push notification!');
    return null;
  }

  try {
    // Get the Expo push token
    // In development builds, we need to pass the projectId explicitly
    // Try to get projectId from EAS config, or use a fallback
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.warn('No EAS projectId found. Push notifications may not work. Run "npx eas build:configure" to set up.');
      // Try without projectId (works in Expo Go and some configurations)
      try {
        const pushTokenData = await Notifications.getExpoPushTokenAsync();
        token = pushTokenData.data;
      } catch {
        console.warn('Push notifications not available in this environment');
        return null;
      }
    } else {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = pushTokenData.data;
    }
    
    console.log('Push token obtained:', token);

    // Save token to backend
    await savePushTokenToBackend(token);
  } catch (error) {
    // This can fail in development builds without proper EAS configuration
    console.warn('Could not get push token (this is normal in development):', error);
  }

  return token;
}

/**
 * Save the push token to the caregiver's record in the database
 * @param token The Expo push token
 */
async function savePushTokenToBackend(token: string): Promise<void> {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();
    const userId = user.userId;

    // Update caregiver record with push token
    await getClient().models.Caregiver.update({
      id: userId,
      push_token: token,
    });

    console.log('Push token saved to backend successfully');
  } catch (error) {
    console.error('Error saving push token to backend:', error);
  }
}

/**
 * Setup notification listeners for when notifications are received
 * @param onNotificationReceived Callback when notification is received
 * @param onNotificationTapped Callback when notification is tapped
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Listener for notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      onNotificationReceived?.(notification);
    }
  );

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification tapped:', response);
      onNotificationTapped?.(response);
    }
  );

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Test function to send a local notification (for testing purposes)
 */
export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification",
      body: 'This is a test notification from Find Shai',
      data: { test: true },
    },
    trigger: { seconds: 2 },
  });
}

