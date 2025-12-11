# Configuration Guide

This document lists all hardcoded values that need to be changed when setting up Find Shai for your own use.

## Overview

The project currently uses several hardcoded values for development purposes. To deploy your own instance, you'll need to update these values in multiple locations.

---

## Backend Configuration

### 1. Loved One ID

The system currently uses a hardcoded Loved One ID. You need to replace this with your own after creating a Loved One record in DynamoDB.

| File | Line | Variable |
|------|------|----------|
| `find-shai/amplify/auth/post-confirmation/handler.ts` | **29** | `HARDCODED_LOVED_ONE_ID` |



---

### 2. Device ID Mapping

The notification decider maps watch device IDs to Loved One IDs.

| File | Line | Variable |
|------|------|----------|
| `find-shai/amplify/functions/notification-decider/handler.ts` | **23-26** | `HARDCODED_CONFIG` |


---

### 3. Calendar URL

The calendar sync uses a hardcoded Google Calendar iCal URL.

| File | Line | Variable |
|------|------|----------|
| `find-shai/amplify/functions/calendar-sync/handler.ts` | **91** | `HARDCODED_ICAL_URL` |

**Current value:** A specific Google Calendar iCal URL

```typescript
// Line 91 - Replace with your own iCal URL:
const HARDCODED_ICAL_URL = "ENTER_YOUR_ICAL_URL_HERE";
```

**How to get your iCal URL:**
1. Open Google Calendar (web)
2. Settings → Select your calendar
3. Integrate calendar → Copy "Secret address in iCal format"

---

### 4. Geofence Collection Name

| File | Lines | Variable |
|------|-------|----------|
| `find-shai/amplify/functions/calendar-sync/handler.ts` | **108** | `HARDCODED_GEOFENCE_COLLECTION` |
| `find-shai/amplify/functions/calendar-sync/handler.ts` | **256** | `HARDCODED_GEOFENCE_COLLECTION` |


```typescript
// Line 108 and Line 256 - Replace with your geofence collection name:
const HARDCODED_GEOFENCE_COLLECTION = "ENTER_YOUR_GEOFENCE_COLLECTION_HERE";
```

---

### 5. Place Index Name

Used for geocoding addresses to coordinates.

| File | Line | Variable |
|------|------|----------|
| `find-shai/amplify/functions/calendar-sync/geofence.ts` | **52** | `IndexName` |
| `find-shai/amplify/functions/geocoding/handler.ts` | **7** | `PLACE_INDEX_NAME` |

---

### 6. Notification Lambda ARN

The EventBridge rule needs the ARN of the notification decider Lambda function.

| File | Line | Variable |
|------|------|----------|
| `find-shai/amplify/auth/post-confirmation/handler.ts` | **80** | `lambda_notif_decider_arn` |

Get this ARN from AWS Console → Lambda → Your notification decider function → Copy ARN.

---

### 7. Location Fetcher Config

The location fetcher needs your tracker name and device ID.

| File | Line | Variable |
|------|------|----------|
| `find-shai/amplify/functions/location-fetcher/handler.ts` | **12** | `TrackerName` |
| `find-shai/amplify/functions/location-fetcher/handler.ts` | **13** | `DeviceId` |

---

## Mobile App Configuration

### 1. Loved One ID

The mobile app uses the same hardcoded Loved One ID in multiple places. **All must be updated to the same value as the backend.**

| File | Line | Variable |
|------|------|----------|
| `find-shai/find-shai-mobile-app/api/data.tsx` | **9** | `HARDCODED_LOVED_ONE_ID` |
| `find-shai/find-shai-mobile-app/app/(tabs)/_layout.tsx` | **17** | `HARDCODED_LOVED_ONE_ID` |
| `find-shai/find-shai-mobile-app/app/(tabs)/calendar/_layout.tsx` | **8** | `HARDCODED_LOVED_ONE_ID` |
| `find-shai/find-shai-mobile-app/app/(tabs)/safezones/SafeZoneCreation.tsx` | **25** | `HARDCODED_LOVED_ONE_ID` |
| `find-shai/find-shai-mobile-app/app/(tabs)/safezones/safeZoneView.tsx` | **18** | `HARDCODED_LOVED_ONE_ID` |

```typescript
// Change in ALL 5 files:
const HARDCODED_LOVED_ONE_ID = "ENTER_YOUR_LOVED_ONE_ID_HERE";
```

---

### 2. Bundle Identifier

Change the iOS bundle identifier for your own app.

| File | Line | Key |
|------|------|-----|
| `find-shai/find-shai-mobile-app/app.json` | **17** | `bundleIdentifier` |

```json
{
  "ios": {
    "bundleIdentifier": "ENTER_YOUR_BUNDLE_IDENTIFIER_HERE"
  }
}
```

---

## Watch App Configuration

See [Watch App Documentation](shaywatchapp/README.md) for detailed instructions.

| Setting | File | Line | Placeholder |
|---------|------|------|-------------|
| Tracker Name | `shaywatchapp/ShayWatchApp WatchKit Extension/LocationTracker.swift` | **19** | `ENTER_YOUR_TRACKER_NAME_HERE` |
| User/Device ID | `shaywatchapp/ShayWatchApp WatchKit Extension/LocationTracker.swift` | **20** | `ENTER_YOUR_DEVICE_ID_HERE` |
| AWS Region (URL) | `shaywatchapp/ShayWatchApp WatchKit Extension/LocationTracker.swift` | **85** | `ENTER_YOUR_AWS_REGION_HERE` |
| AWS Access Key ID | `shaywatchapp/ShayWatchApp WatchKit Extension/LocationTracker.swift` | **87** | `ENTER_YOUR_ACCESS_KEY_ID_HERE` |
| AWS Secret Access Key | `shaywatchapp/ShayWatchApp WatchKit Extension/LocationTracker.swift` | **87** | `ENTER_YOUR_SECRET_ACCESS_KEY_HERE` |
| AWS Region (Signer) | `shaywatchapp/ShayWatchApp WatchKit Extension/LocationTracker.swift` | **88** | `ENTER_YOUR_AWS_REGION_HERE` |
| Bundle Identifier | `shaywatchapp/ShayWatchApp WatchKit Extension/Info.plist` | **10** | `ENTER_YOUR_BUNDLE_ID_HERE.watchkitapp` |
| Bundle Identifier | `shaywatchapp/ShayWatchApp.xcodeproj/project.pbxproj` | multiple | `ENTER_YOUR_BUNDLE_ID_HERE` |

**Important:** The `userId` in the watch app must match the `DeviceId` in the backend's `HARDCODED_CONFIG`.

---

## Summary Table

| Component | File | Line(s) | Value to Change |
|-----------|------|---------|-----------------|
| **Backend** | `find-shai/amplify/auth/post-confirmation/handler.ts` | 29 | `HARDCODED_LOVED_ONE_ID` |
| **Backend** | `find-shai/amplify/functions/notification-decider/handler.ts` | 23-26 | `HARDCODED_CONFIG` (UserId + DeviceId) |
| **Backend** | `find-shai/amplify/functions/calendar-sync/handler.ts` | 91 | `HARDCODED_ICAL_URL` |
| **Backend** | `find-shai/amplify/functions/calendar-sync/handler.ts` | 108, 256 | `HARDCODED_GEOFENCE_COLLECTION` |
| **Backend** | `find-shai/amplify/functions/calendar-sync/geofence.ts` | 52 | `IndexName` |
| **Backend** | `find-shai/amplify/functions/geocoding/handler.ts` | 7 | `PLACE_INDEX_NAME` |
| **Backend** | `find-shai/amplify/auth/post-confirmation/handler.ts` | 80 | `lambda_notif_decider_arn` |
| **Backend** | `find-shai/amplify/functions/location-fetcher/handler.ts` | 12-13 | `TrackerName`, `DeviceId` |
| **Mobile** | `find-shai/find-shai-mobile-app/api/data.tsx` | 9 | `HARDCODED_LOVED_ONE_ID` |
| **Mobile** | `find-shai/find-shai-mobile-app/app/(tabs)/_layout.tsx` | 17 | `HARDCODED_LOVED_ONE_ID` |
| **Mobile** | `find-shai/find-shai-mobile-app/app/(tabs)/calendar/_layout.tsx` | 8 | `HARDCODED_LOVED_ONE_ID` |
| **Mobile** | `find-shai/find-shai-mobile-app/app/(tabs)/safezones/SafeZoneCreation.tsx` | 25 | `HARDCODED_LOVED_ONE_ID` |
| **Mobile** | `find-shai/find-shai-mobile-app/app/(tabs)/safezones/safeZoneView.tsx` | 18 | `HARDCODED_LOVED_ONE_ID` |
| **Mobile** | `find-shai/find-shai-mobile-app/app.json` | 17 | `bundleIdentifier` |
| **Mobile** | `find-shai/find-shai-mobile-app/ios/findshaimobileapp.xcodeproj/project.pbxproj` | multiple | `bundleIdentifier` |
| **Mobile** | `find-shai/find-shai-mobile-app/ios/findshaimobileapp/Info.plist` | 31 | `bundleIdentifier` |
| **Watch** | `shaywatchapp/ShayWatchApp WatchKit Extension/LocationTracker.swift` | 19 | `trackerName` |
| **Watch** | `shaywatchapp/ShayWatchApp WatchKit Extension/LocationTracker.swift` | 20 | `userId` (Device ID) |
| **Watch** | `shaywatchapp/ShayWatchApp WatchKit Extension/LocationTracker.swift` | 85 | AWS Region (URL) |
| **Watch** | `shaywatchapp/ShayWatchApp WatchKit Extension/LocationTracker.swift` | 87 | AWS Credentials |
| **Watch** | `shaywatchapp/ShayWatchApp WatchKit Extension/LocationTracker.swift` | 88 | AWS Region (Signer) |
| **Watch** | `shaywatchapp/ShayWatchApp WatchKit Extension/Info.plist` | 10 | `bundleIdentifier` |
| **Watch** | `shaywatchapp/ShayWatchApp.xcodeproj/project.pbxproj` | multiple | `bundleIdentifier` |

