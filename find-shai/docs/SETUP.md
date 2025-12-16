# Find Shai - Setup Guide

This guide walks you through setting up the Find Shai project from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Node.js | 20.x | `nvm install 20` or [nodejs.org](https://nodejs.org) |
| npm | 10.x+ | Comes with Node.js |
| AWS CLI | 2.x | [AWS CLI Installation](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| Xcode | 15.0+ | Mac App Store |
| CocoaPods | 1.14+ | `sudo gem install cocoapods` |
| Expo CLI | Latest | `npm install -g expo-cli` |


## Project Structure

The Find Shai project consists of two main parts:

### 1. Find Shai (Main Application)
Contains the AWS backend infrastructure and the mobile application.

### 2. Watch App (ShayWatchApp)
Apple Watch application that tracks location and sends updates to AWS.


### Component Relationships

**Data Flow:**
- **Watch App** → Sends GPS location → **AWS Location Service**
- **AWS Location Service** → Triggers geofence events → **EventBridge**
- **EventBridge** → Routes events → **notification-decider Lambda**
- **Lambda** → Sends notifications → **Pinpoint** → **Mobile App**
- **Mobile App** → Queries data → **AppSync** → **DynamoDB**
- **Mobile App** → Calls functions → **Lambda Functions** → **AWS Services**

### Directory Structure

```
find-shai/
├── find-shai/
│   ├── amplify/                    # AWS Backend (SERVER-SIDE)
│   │   │                           # Defines & deploys AWS infrastructure
│   │   ├── auth/                   # Cognito Authentication
│   │   │   ├── post-confirmation/ # Creates Caregiver on signup
│   │   │   └── delete-user/        # Cleans up user data
│   │   ├── data/                   # AppSync & DynamoDB schema
│   │   ├── functions/              # Lambda Functions
│   │   │   ├── calendar-sync/      # Syncs iCal events & creates geofences
│   │   │   ├── location-fetcher/   # Gets latest position from tracker
│   │   │   ├── geocoding/          # Converts addresses to coordinates
│   │   │   ├── notification-decider/ # Processes events & sends notifications
│   │   │   └── watch-pairing/      # Watch pairing functionality
│   │   └── backend.ts              # Backend configuration
│   │
│   └── find-shai-mobile-app/       # React Native Mobile App (CLIENT-SIDE)
│       ├── app/                     # Expo Router screens
│       │   └── (tabs)/              # Tab navigation
│       │       ├── index.tsx        # Home screen
│       │       ├── calendar/        # Calendar view
│       │       ├── notifications/   # Notifications list
│       │       ├── safezones/       # Safe zones management
│       │       └── settings/       # Settings & configuration
│       ├── api/                     # API client layer (connects to backend)
│       │   ├── amplify-config.tsx   # Configures Amplify SDK to use backend
│       │   └── data.tsx            # GraphQL client (queries AppSync API)
│       ├── services/               # External service integrations
│       │   ├── geocoding.ts        # Geocoding service
│       │   └── pushNotifications.ts # Push notification service
│       ├── state/                   # State management
│       │   └── state.tsx           # Global app state
│       └── ios/                     # iOS native code
│
└── shaywatchapp/                   # Apple Watch App
    ├── ShayWatchApp WatchKit App/  # Watch app bundle
    └── ShayWatchApp WatchKit Extension/ # Watch app logic
        ├── LocationTracker.swift    # Sends location to AWS
        ├── LocationManager.swift    # GPS location management
        ├── ContentView.swift        # Main watch UI
        └── ComplicationController.swift # Watch face complication
```

## AWS Account Setup

### 1. Create an AWS Account

If you don't have one, create an AWS account at [aws.amazon.com](https://aws.amazon.com).

### 2. Set Up the AWS CLI

Follow the official AWS guide to configure the AWS CLI with your credentials:

**[Setting up the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-quickstart.html)**

### 3. Configure Required Permissions

Ensure your IAM user/role has the required permissions for AWS Amplify. See the official documentation:

**[AWS Amplify IAM Managed Policies](https://docs.aws.amazon.com/amplify/latest/userguide/security-iam-awsmanpol.html)**


## Project Setup

### 1. Clone the Repository

```bash
git clone [REPOSITORY_URL]
cd find-shai
```

### 2. Install Backend Dependencies

```bash
# Use Node.js 20
nvm use 20

# Install root dependencies
npm install
```

### 3. Deploy AWS Backend

```bash
# Initialize and deploy your personal cloud sandbox
npx ampx sandbox
```

This will:
- Deploy all AWS resources to your account (Cognito, DynamoDB, Lambda, AppSync, Location Service, Pinpoint, etc.)
- Generate `amplify_outputs.json` with your configuration
- Watch for code changes and automatically redeploy

> **Note**: Keep this terminal running during development. The sandbox creates real AWS resources in your account, isolated per developer. Press `Ctrl+C` to stop and optionally delete the sandbox resources.


### 4. Install Mobile App Dependencies

```bash
cd find-shai-mobile-app
npm install
```

### 5. Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

### 6. Amplify Configuration

After deploying your AWS backend with `npx ampx sandbox`, copy the generated configuration to the mobile app:

```bash
cp ../amplify_outputs.json app/amplify_outputs.json
```

> **Note**: The `amplify_outputs.json` file contains your AWS configuration and is gitignored. You must generate your own by deploying the backend.

### 7. Run the Mobile App

First, generate the native iOS code:

```bash
npx expo prebuild
```

Then run the app:

```bash
npx expo run:ios
```

## Testing & Development Features

### Creating a Loved One for Testing

The mobile app includes a testing feature that allows you to create a Loved One directly from the Settings screen. This is useful during development and testing.

**To enable the testing feature:**

1. Open `find-shai/find-shai-mobile-app/app/(tabs)/settings/settingsView.tsx`
2. Change the `SHOW_DEV_FEATURES` flag from `false` to `true`:

```typescript
// ============================================
// FEATURE FLAGS - Set to true for creating loved one for testing
// ============================================
const SHOW_DEV_FEATURES = true;  // Changed from false
// ============================================
```

3. Restart the app
4. Navigate to the Settings tab
5. You'll see a "Create Loved One (Testing)" button
6. Tap the button to create a Loved One with default values:
   - Name: "Shai"
   - Email: "shai@example.com"
   - Calendar Token: "none"

**To change these values after creation:**

You can update the Loved One record directly in AWS DynamoDB:
1. Go to AWS Console → DynamoDB
2. Find the `LovedOne` table
3. Search for the Loved One record (using the `HARDCODED_LOVED_ONE_ID` value)
4. Edit the record to update fields like `name`, `email`, `calander_token`, etc.

Alternatively, you can modify the default values in the code before creating the Loved One. Edit the `createLovedOne` function call in `settingsView.tsx` (line 26) to pass custom values:

```typescript
const success = await createLovedOne('Your Name', 'your@email.com', 'your-calendar-token');
```

> **Note**: This feature creates a Loved One record in DynamoDB but uses placeholder values for `tracker_arn` and `geofence_collection_arn`. For production use, create Loved Ones through the signup process (with type `"lovedone"`) which automatically sets up all required AWS Location Service resources.

> **Warning**: Keep `SHOW_DEV_FEATURES` set to `false` in production builds. This feature is intended for development and testing only.

