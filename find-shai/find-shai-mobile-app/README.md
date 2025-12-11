# Find Shai Mobile App

The caregiver-facing iOS app for the Find Shai location tracking system.

## Overview

This React Native/Expo app allows caregivers to:
- View real-time location on a map
- Set up safe zones (geofences)
- Sync calendar events for location-based notifications
- Receive push notifications when loved ones enter/exit locations


## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

### 3. Configure Amplify

After deploying your AWS backend with `npx ampx sandbox`, copy the generated configuration to the mobile app:

```bash
cp ../amplify_outputs.json app/amplify_outputs.json
```

> **Note**: The `amplify_outputs.json` file contains your AWS configuration and is gitignored. You must generate your own by deploying the backend.

### 4. Run the App

Generate native code and run:

```bash
npx expo prebuild
npx expo run:ios
```

Or use the npm script:

```bash
npm run ios
```

## Key Features

### Location Tracking

The app displays the loved one's location on a map, updated from the AWS Location Service tracker.

### Safe Zones

Caregivers can create geofences in the Safe Zones tab:

1. **Add a Custom Safe Zone**: 
   - Go to Safe Zones tab
   - Tap "Add" next to "Custom"
   - Enter a name for the zone
   - Search for an address
   - Confirm to create a boundary around that location

2. **Set Home Location**: 
   - Go to Safe Zones tab
   - Tap "Add" next to "Home"
   - Search for your home address
   - Confirm to set as home

### Calendar Integration

Events are synced from a shared calendar. When events have location data, the app:
1. Creates geofences around event locations
2. Notifies caregivers when the loved one arrives/leaves

### Push Notifications

Notifications are sent when:
- Loved one enters a safe zone
- Loved one exits a safe zone
- Loved one arrives at a calendar event location
- Loved one is late for a scheduled event

### Initial Setup

The system requires manual configuration:

1. **Create a Loved One** in AWS DynamoDB with tracker and geofence collection ARNs
2. **Create Caregiver(s)** linked to that Loved One (multiple caregivers can monitor one loved one)
3. **Configure the Watch App** with the tracker name, device ID, and AWS credentials

See [AWS Location Service Setup](../docs/AWS_LOCATION_SERVICE.md) and [Watch App Setup](../../shaywatchapp/README.md) for details.
