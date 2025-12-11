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

