# Watch App Documentation

The Find Shai Watch App is a companion Apple Watch application that tracks the wearer's location and sends updates to AWS Location Service.

## Overview

The watch app:
- Runs continuously in the background
- Tracks GPS location every 30 seconds
- Sends location updates directly to AWS Location Service
- Monitors battery level
- Displays the current Hebrew date on the watch face
- Operates independently - no phone connection required

## How It Works

```
┌─────────────────────┐
│   Apple Watch       │
│   (Loved One)       │
└──────────┬──────────┘
           │
           │ GPS Location
           │ Every 30 seconds
           │
           ▼
┌─────────────────────┐
│  AWS Location       │
│  Service Tracker    │
│  (via HTTPS POST)   │
└──────────┬──────────┘
           │
           │ Triggers events
           │
           ▼
┌─────────────────────┐
│  Geofence           │
│  ENTER/EXIT Events  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  EventBridge →      │
│  Lambda →           │
│  Push Notification  │
└─────────────────────┘
```

## Technical Details

### Location Tracking

The app uses `CLLocationManager` to get GPS coordinates and sends them to AWS via HTTPS POST:

**Endpoint**:
```
https://tracking.geo.{region}.amazonaws.com/tracking/v0/trackers/{trackerName}/positions
```

**Payload**:
```json
{
  "Updates": [{
    "DeviceId": "device-unique-id",
    "Position": [longitude, latitude],
    "SampleTime": "2024-01-15T10:30:00Z"
  }]
}
```


### Key File

**Location**: `ShayWatchApp WatchKit Extension/LocationTracker.swift`

## Configuration

To use the watch app with your own AWS account, update these values in `LocationTracker.swift`:

### 1. Tracker Name (line 19)

```swift
var trackerName = "ENTER_YOUR_TRACKER_NAME_HERE"
```

This must match the tracker you created in AWS Location Service.

### 2. User/Device ID (line 20)

```swift
var userId = "ENTER_YOUR_DEVICE_ID_HERE"
```

**Important**: This must match the `DeviceId` in the backend's `HARDCODED_CONFIG`. This links the watch's location data to the correct Loved One profile.

### 3. AWS Region (line 85)

```swift
// Line 85 - Update the URL endpoint with your region
let url = URL(string: "https://tracking.geo.ENTER_YOUR_AWS_REGION_HERE.amazonaws.com/tracking/v0/trackers/\(trackerName)/positions")!
```

### 4. AWS Credentials (line 87)

```swift
let credentials = StaticCredential(
    accessKeyId: "ENTER_YOUR_ACCESS_KEY_ID_HERE",
    secretAccessKey: "ENTER_YOUR_SECRET_ACCESS_KEY_HERE"
)
```

Get these from the [AWS Location Service Setup](../find-shai/docs/AWS_LOCATION_SERVICE.md#5-create-access-keys).

### 5. AWS Region for Signer (line 88)

```swift
let signer = AWSSigner(credentials: credentials, name: "geo", region: "ENTER_YOUR_AWS_REGION_HERE")
```

## Linking to Mobile App

The watch is linked to a Loved One by using the same ID:

1. **Create Loved One** in AWS DynamoDB (see below)
2. **Set `userId`** in the watch app to match the Loved One's `id`
3. **Create Caregiver(s)** in DynamoDB linked to that Loved One
4. Location updates from the watch will now be visible to all linked caregivers

### Creating Records in DynamoDB

You need to manually create the following records in AWS DynamoDB:

**LovedOne record**:
- `id`: Unique identifier (use this as `userId` in watch app)
- `name`: Name of the loved one
- `email`: Email address
- `tracker_arn`: ARN of your AWS Location tracker
- `geofence_collection_arn`: ARN of your geofence collection
- `default_radius`: Default geofence radius in meters (e.g., 100)
- `calander_token`: Calendar iCal URL (or empty string)
- `calander_events`: Empty array `[]`
- `safe_zones`: Empty array `[]`
- `known_locations`: Empty array `[]`

**Caregiver record(s)**:
- `id`: Cognito user ID (created on signup)
- `name`: Caregiver name
- `email`: Caregiver email
- `loved_one_id`: The Loved One's `id` from above

## Building the Watch App

### Steps

1. Open the `.xcodeproj` in Xcode
2. Update the configuration values (see above)
3. Select your development team
4. Build and run on your Apple Watch

