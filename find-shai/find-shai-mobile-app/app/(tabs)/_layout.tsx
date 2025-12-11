import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StateProvider, useStateContext } from '@/state/state';
import { fetchNotifications, fetchLastLocation } from '@/api/data';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { Schema } from '../../../amplify/data/resource';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const client = generateClient<Schema>({authMode: 'userPool'});

// HARDCODED loved one - all caregivers see this one
const HARDCODED_LOVED_ONE_ID = "ENTER_YOUR_LOVED_ONE_ID_HERE";

// Component that fetches initial data after StateProvider is set up
function DataFetcher({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useStateContext();

  useEffect(() => {
    const fetchUserData = async () => {
      dispatch({ type: 'FETCH_DATA_REQUEST_START' });
      try {
        const { userId } = await getCurrentUser();
        console.log('userId: ', userId);
        const { data, errors } = await client.models.Caregiver.get({
          id: userId,
        });

        console.log(errors || 'no errors');
        console.log(data || 'no data');

        if (data) {
          fetchNotifications(data, dispatch);
        }

        if (!errors && data) {
          dispatch({ type: 'SET_CAREGIVER', payload: data });
        }
        
        // Always fetch the hardcoded loved one (not from caregiver's loved_one_id)
        console.log('Fetching hardcoded loved one:', HARDCODED_LOVED_ONE_ID);
        const { data: loved_one } = await client.models.LovedOne.get({
          id: HARDCODED_LOVED_ONE_ID,
        });
        console.log('Fetched loved one:', loved_one);
        
        if (loved_one) {
          dispatch({ type: 'SET_LOVEDONE', payload: loved_one });
          fetchLastLocation(HARDCODED_LOVED_ONE_ID, dispatch);
        } else {
          console.log('Hardcoded loved one not found!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
      dispatch({ type: 'FETCH_DATA_REQUEST_DONE' });
    };

    fetchUserData();
  }, [dispatch]);

  if (state.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <StateProvider>
      <DataFetcher>
        <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
        }}>
          
          <Tabs.Screen
            name="index"
            options={{
              title: 'Map',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: 'Notifications',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name={focused ? 'notifications' : 'notifications-outline'} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: 'Events',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name={focused ? 'calendar' : 'calendar-outline'} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="safezones"
            options={{
              title: 'SafeZones',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name={focused ? 'location' : 'location-outline'} color={color} />
              ),
            }}
          />
          
          <Tabs.Screen
            name="settings"
            options={{
              title: 'Settings',
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
              ),
            }}
          />
        </Tabs>
        </DataFetcher>
      </StateProvider>
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

