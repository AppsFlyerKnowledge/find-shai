import React from "react";
import { Stack } from "expo-router";
import { Button, Alert } from "react-native";
import { useStateContext } from "@/state/state";
import { calendarSync, fetchUserData } from "../../../api/data";

// HARDCODED loved one - all caregivers see this one
const HARDCODED_LOVED_ONE_ID = "ENTER_YOUR_LOVED_ONE_ID_HERE";

export default function Layout() {
  const { dispatch } = useStateContext();

  const handleSyncNow = async () => {
    try {
      await calendarSync(HARDCODED_LOVED_ONE_ID);
      await fetchUserData(dispatch);
      Alert.alert('Success', 'Calendar synced successfully!');
    } catch (error) {
      console.error('Error syncing calendar:', error);
      Alert.alert('Error', 'Failed to sync calendar');
    }
  };

  return (
    <Stack>
      <Stack.Screen
        name="calendarView"
        options={{
          title: "Calendar",
          headerRight: () => (
            <Button
              onPress={handleSyncNow}
              title="Sync Now"
            />
          ),
          headerTitleStyle: {
            fontSize: 24,
          },
        }}
      />
    </Stack>
  );
}
