import React, { useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Authenticator } from "@aws-amplify/ui-react-native";
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser } from 'aws-amplify/auth';
import { ensureAmplifyConfigured } from '../api/amplify-config';
import { registerForPushNotificationsAsync, setupNotificationListeners } from '../services/pushNotifications';

// Configure Amplify immediately on module load
ensureAmplifyConfigured();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({});
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');

  // Check auth status on mount
  useEffect(() => {
    
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        setAuthState('authenticated');
      } catch (error) {
        console.log('User is NOT authenticated:', error);
        setAuthState('unauthenticated');
      }
    };

    checkAuth();

    // Listen for auth events
    const hubListener = Hub.listen('auth', (data) => {
      console.log('Auth Hub event:', data.payload.event);
      if (data.payload.event === 'signedIn') {
        console.log('User signed in via Hub');
        setAuthState('authenticated');
      } else if (data.payload.event === 'signedOut') {
        console.log('User signed out via Hub');
        setAuthState('unauthenticated');
      }
    });

    return () => hubListener();
  }, []);

  // Setup push notifications when authenticated
  useEffect(() => {
    if (authState === 'authenticated') {
      registerForPushNotificationsAsync().catch((error) => {
        console.error('Failed to register for push notifications:', error);
      });

      const cleanup = setupNotificationListeners(
        (notification) => {
          console.log('Notification received in app:', notification);
        },
        (response) => {
          console.log('User tapped notification:', response);
        }
      );

      return cleanup;
    }
  }, [authState]);

  // Hide splash when ready
  useEffect(() => {
    if (loaded && authState !== 'checking') {
      SplashScreen.hideAsync();
    }
  }, [loaded, authState]);

  // Show loading while checking auth or loading fonts
  if (!loaded || authState === 'checking') {
    console.log('Showing loading screen, loaded:', loaded, 'authState:', authState);
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }


  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Authenticator.Provider>
        {authState === 'authenticated' ? (
          <Slot />
        ) : (
          <Authenticator>
            <Slot />
          </Authenticator>
        )}
      </Authenticator.Provider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});
