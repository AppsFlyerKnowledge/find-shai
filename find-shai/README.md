# Find Shai Mobile App

This project is built using AWS Amplify Gen 2. Technologies used:

1. **Lambda** - Serverless compute
2. **AppSync** - GraphQL API
3. **Cognito** - Authentication & Authorization
4. **Pinpoint** - Push notifications (APNS)
5. **DynamoDB** - Data storage (users, safe zones, events)
6. **AWS Location Services** - Geofencing & location tracking
7. **EventBridge** - Routes geofence events to Lambda


## AWS Services

### Amazon Cognito

Handles user authentication and authorization.

- **User Pool**: Stores caregiver credentials
- **Identity Pool**: Provides AWS credentials for authenticated users
- **Triggers**: Post-confirmation Lambda creates Caregiver record

### AWS AppSync

GraphQL API for all data operations.

- **Queries**: Fetch data (caregivers, loved ones, notifications)
- **Mutations**: Create/update/delete operations
- **Subscriptions**: Real-time updates (not currently used)

### Amazon DynamoDB

NoSQL database storing all application data.

- **Caregiver Table**: User profiles and settings
- **LovedOne Table**: Monitored individuals
- **Notification Table**: Notification history

### AWS Lambda Functions

Serverless functions for business logic.

| Function | Purpose |
|----------|---------|
| `post-confirmation` | Creates Caregiver record after signup |
| `delete-user` | Cleans up user data on account deletion |
| `calendar-sync` | Syncs events from iCal and creates geofences |
| `location-fetcher` | Gets latest position from tracker |
| `geocoding` | Converts addresses to coordinates |
| `notification-decider` | Processes events and sends notifications |
| `watch-pairing/create-code` | Generates pairing codes (not currently used) |
| `watch-pairing/check-for-code` | Validates pairing codes (not currently used) |

### Amazon Location Service

Geospatial services for tracking and geofencing.

- **Trackers**: Store device location history
- **Geofence Collections**: Define geographic boundaries
- **Events**: Triggered on ENTER/EXIT geofences

> See [AWS Location Service Setup](docs/AWS_LOCATION_SERVICE.md) for manual configuration steps.

### Amazon Pinpoint

Push notification infrastructure (used alongside Expo Push Service).

- **APNS Channel**: iOS push notifications
- **Endpoints**: Device registration

### Amazon EventBridge

Event routing for geofence triggers.

- Routes Location Service events to Lambda
- Enables decoupled event processing



## Data Flows

### User Registration

```
1. User signs up in mobile app
   ↓
2. Cognito creates user in User Pool
   ↓
3. Post-confirmation Lambda triggered
   ↓
4. Lambda creates Caregiver record in DynamoDB
   ↓
5. App redirects to home screen
```

### Watch Setup (Manual Configuration)

```
1. Admin creates Loved One record in DynamoDB
   ↓
2. Admin creates AWS Location tracker
   ↓
3. Admin configures watch app with:
   - Loved One ID (as userId)
   - Tracker name
   - AWS credentials
   ↓
4. Watch sends location to tracker
   ↓
5. Caregivers sign up and are linked to Loved One
```

> See [Watch App Setup](../shaywatchapp/README.md) for detailed configuration steps.

### Location Tracking

```
1. Watch sends location to AWS Location Tracker
   ↓
2. Location Service updates tracker position
   ↓
3. Location Service checks against geofences
   ↓
4. If ENTER/EXIT detected, EventBridge triggered
   ↓
5. notification-decider Lambda invoked
   ↓
6. Lambda determines notification type
   ↓
7. Push notification sent via Expo
   ↓
8. Caregiver receives notification
```

### Calendar Sync

```
1. Caregiver triggers calendar sync (or EventBridge scheduled trigger)
   ↓
2. calendar-sync Lambda called
   ↓
3. Lambda fetches events from hardcoded iCal URL
   ↓
4. Lambda parses locations from events
   ↓
5. Lambda creates/updates geofences in AWS Location Service
   ↓
6. Calendar events and safe zones stored in LovedOne record
```

> **Note**: The calendar sync currently uses a hardcoded iCal URL shared by all caregivers, not individual Google Calendar OAuth tokens.

### Push Notification Flow

```
1. Event triggers notification-decider Lambda
   ↓
2. Lambda fetches Caregiver from DynamoDB
   ↓
3. Lambda retrieves push_token
   ↓
4. Lambda sends to Expo Push Service API
   ↓
5. Expo delivers to iOS device via APNs
   ↓
6. Device displays notification
```


## Security

### Authentication

- All API requests require valid Cognito JWT
- Guest access allowed for watch pairing endpoints
- IAM roles restrict Lambda permissions

### Authorization

- Caregivers can only access their own data
- Loved Ones linked via `loved_one_id` foreign key
- Row-level security in DynamoDB

### Data Protection

- All data encrypted at rest (DynamoDB)
- All data encrypted in transit (HTTPS)
- Push tokens stored securely

## Scalability

The serverless architecture automatically scales:

- **Lambda**: Scales to handle concurrent requests
- **DynamoDB**: On-demand capacity scaling
- **AppSync**: Managed service with auto-scaling
- **Location Service**: Managed service

## Monitoring

### CloudWatch

- Lambda function logs
- API request metrics
- Error tracking

### Amplify Console

- Deployment status
- Build logs
- Environment management