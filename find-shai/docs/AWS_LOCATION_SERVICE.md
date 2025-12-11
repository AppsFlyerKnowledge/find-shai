# AWS Location Service Setup

This guide explains how to set up AWS Location Service for device tracking and geofencing.

## Overview

AWS Location Service is used to:
- Track the location of the loved one's watch
- Create geofences around safe zones and calendar event locations
- Trigger notifications when the watch enters or exits geofences

## Setup Steps

### 1. Create an AWS Location Service Tracker

1. Go to **AWS Console** → **Amazon Location Service**
2. Click **Trackers** in the left sidebar
3. Click **Create tracker**
4. Configure the tracker:
   - **Name**: Choose a descriptive name (e.g., `findshai-tracker`)
   - **Description**: Optional description
   - **Position filtering**: Choose based on your needs
5. Click **Create tracker**
6. **Note the tracker name** - you'll need this for the watch app

### 2. Create a Geofence Collection

1. In Amazon Location Service, click **Geofence collections**
2. Click **Create geofence collection**
3. Configure:
   - **Name**: Choose a name
   - **Description**: Optional
4. Click **Create geofence collection**

### 3. Link Tracker to Geofence Collection

1. Go to your tracker
2. Click **Link geofence collection**
3. Select your geofence collection
4. This enables automatic ENTER/EXIT events when the tracked device crosses geofence boundaries

### 4. Create IAM User for Watch App

The watch app needs credentials to send location updates to AWS.

1. Go to **IAM** → **Users** → **Create user**
2. Enter a username (e.g., `findshai-watch-tracker`)
3. Click **Next**
4. Select **Attach policies directly**
5. Click **Create policy** and use this JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "geo:BatchUpdateDevicePosition"
      ],
      "Resource": "arn:aws:geo:YOUR-REGION:YOUR-ACCOUNT-ID:tracker/YOUR-TRACKER-NAME"
    }
  ]
}
```

Replace:
- `YOUR-REGION` with your AWS region (e.g., `eu-west-1`)
- `YOUR-ACCOUNT-ID` with your 12-digit AWS account ID
- `YOUR-TRACKER-NAME` with the tracker name from step 1

6. Name the policy (e.g., `FindShaiTrackerPolicy`) and create it
7. Attach this policy to the user
8. Complete user creation

### 5. Create Access Keys

1. Go to the IAM user you created
2. Click **Security credentials** tab
3. Click **Create access key**
4. Select **Application running outside AWS**
5. Click **Create access key**
6. **Download or copy both:**
   - Access key ID
   - Secret access key

> **Important**: Store these securely. You cannot retrieve the secret access key again after this screen.


## Required Information Summary

After setup, you should have:

| Item | Example | Used In |
|------|---------|---------|
| Tracker Name | `findshai-tracker` | Watch App |
| AWS Region | `eu-west-1` | Watch App, Backend |
| Access Key ID | `AKIA...` | Watch App |
| Secret Access Key | `wJalr...` | Watch App |
| Geofence Collection Name | `....-geofences` | Backend |

## Update the Watch App

See [Watch App Documentation](../../shaywatchapp/README.md) for how to configure the watch app with these credentials.

