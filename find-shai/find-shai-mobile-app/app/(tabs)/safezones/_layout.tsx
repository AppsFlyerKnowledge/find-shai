import React from "react";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="safeZoneView"
        options={{
          title: "Safe Zones",
          headerTitleStyle: {
            fontSize: 24,
          },
        }}
      />
      <Stack.Screen
        name="safezone"
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="SafeZoneCreation"
        options={({ route }) => ({
          title: getScreenTitle(route.params?.type ?? "Unknown"), // Dynamic title
        })}
      />
    </Stack>
  );
}

function getScreenTitle(screenName: string): string {
  if (screenName === "add_custom") {
    return "Add Custom Safe Zone";
  } else if (screenName === "add_home") {
    return "Add Home";
  } else if (screenName === "SafeZoneCreation") {
    return "Create Safe Zone";
  } else {
    return "Unknown Screen";
  }
}
