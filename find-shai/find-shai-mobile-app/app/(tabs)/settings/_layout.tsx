import React from "react";
import { Stack } from "expo-router";

export default function Layout2() {
  return (
    <Stack>
      <Stack.Screen
        name="settingsView"
        options={{
          title: "Settings",
          headerTitleStyle: {
            fontSize: 24,
          },
        }}
      />
      <Stack.Screen
        name="verify_token"
        options={{
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
