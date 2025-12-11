import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { calendarSync } from "./functions/calendar-sync/resource";
import { createCode, checkForCode } from "./functions/watch-pairing/resource";
import { notificationDecider } from "./functions/notification-decider/resource";
import { Policy, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { aws_events, aws_events_targets } from "aws-cdk-lib";
import { CfnApp } from "aws-cdk-lib/aws-pinpoint";
import { Stack } from "aws-cdk-lib/core";
import { postConfirmation } from "./auth/post-confirmation/resource";
import { deleteUser } from "./auth/delete-user/resource";
import { locationFetcher } from "./functions/location-fetcher/resource";
import { geocoding } from "./functions/geocoding/resource";

import * as iam from "aws-cdk-lib/aws-iam";

const backend = defineBackend({
  auth,
  data,
  calendarSync,
  notificationDecider,
  postConfirmation,
  deleteUser,
  locationFetcher,
  geocoding,
  createCode,
  checkForCode,
});

const { cfnResources } = backend.data.resources;

// Enable TTL for WatchPairing model
cfnResources.amplifyDynamoDbTables["WatchPairing"].timeToLiveAttribute = {
  attributeName: "ttl", // Ensure this is the name used in the Lambda handler
  enabled: true,
};

const notificationDeciderLambda = backend.notificationDecider.resources.lambda;
const locationFetcherLambda = backend.locationFetcher.resources.lambda;
const geocodingLambda = backend.geocoding.resources.lambda;

/**
 * Add Push Notification capabilities
 */

const analyticsStack = backend.createStack("analytics-stack");

// Reference or create an EventBridge EventBus
const eventBus = aws_events.EventBus.fromEventBusName(
  analyticsStack,
  "MyEventBus",
  "default"
);

backend.data.addEventBridgeDataSource("MyEventBridgeDataSource", eventBus);

// Create an EventBridge rule to route AWS Location Service geofence events to the notification-decider Lambda
// This triggers when the watch enters or exits a geofence
const geofenceEventRule = new aws_events.Rule(analyticsStack, "GeofenceEventRule", {
  eventBus: eventBus,
  ruleName: "enter-exit-geofence-lambda-trigger",
  eventPattern: {
    source: ["aws.geo"],
    detailType: ["Location Geofence Event"],
    // Match all geofence collections - you can restrict this to specific collections if needed
  },
  targets: [
    new aws_events_targets.LambdaFunction(notificationDeciderLambda),
  ],
});

// create a Pinpoint app
const pinpointApp = new CfnApp(analyticsStack, "Pinpoint", {
  name: "myPinpointApp",
});

const postConfirmationLambda = backend.postConfirmation.resources.lambda;
const calendarSyncLambda = backend.calendarSync.resources.lambda;

const statement = new iam.PolicyStatement({
  sid: "AllowAllGeo",
  actions: ["geo:*"],
  resources: ["*"],
});

const eventBridgePolicy = new iam.PolicyStatement({
  sid: "AllowEventBridgeActions",
  actions: [
    "events:PutRule",
    "events:PutTargets",
    "events:DescribeRule",
    "events:DeleteRule",
    "events:RemoveTargets",
  ],
  resources: ["*"],
});

const lambdaPermissionPolicy = new iam.PolicyStatement({
  sid: "AllowLambdaAddPermission",
  actions: ["lambda:AddPermission"],
  resources: ["*"],
});

postConfirmationLambda.addToRolePolicy(lambdaPermissionPolicy);
postConfirmationLambda.addToRolePolicy(statement);
postConfirmationLambda.addToRolePolicy(eventBridgePolicy);
calendarSyncLambda.addToRolePolicy(statement);
locationFetcherLambda.addToRolePolicy(statement);
geocodingLambda.addToRolePolicy(statement);

const notificationDeciderStatement = new iam.PolicyStatement({
  sid: "AllowSendPushNotification",
  actions: ["mobiletargeting:*"],
  resources: ["*"],
});

notificationDeciderLambda.addToRolePolicy(notificationDeciderStatement);

// const apnsSandboxChannel = new pinpoint.CfnAPNSChannel(analyticsStack, 'APNSChannel', {
//   applicationId: pinpointApp.ref,
// });

// pinpointApp.addDependency(apnsSandboxChannel)

// const cfnAPNSSandboxChannel = new pinpoint.CfnAPNSSandboxChannel(analyticsStack, 'MyCfnAPNSSandboxChannel', {
//   applicationId: pinpointApp.attrArn,

//   // the properties below are optional
//   // bundleId: 'com.appsflyer.support.two',
//   // certificate: 'certificate',
//   // enabled: false,
//   // privateKey: 'privateKey',
//   // teamId: 'teamId',
//   // tokenKey: 'tokenKey',
//   // tokenKeyId: 'tokenKeyId',
// });

// pinpointApp.addDependency(cfnAPNSSandboxChannel)

// create an IAM policy to allow interacting with Pinpoint
const pinpointPolicy = new Policy(analyticsStack, "PinpointPolicy", {
  policyName: "PinpointPolicy",
  statements: [
    new PolicyStatement({
      actions: ["mobiletargeting:UpdateEndpoint", "mobiletargeting:PutEvents"],
      resources: [pinpointApp.attrArn + "/*"],
    }),
  ],
});

const appSyncAllPolicy = new Policy(analyticsStack, "AppSyncPolicy", {
  policyName: "AppSyncPolicy",
  statements: [
    new PolicyStatement({
      actions: ["appsync:*"],
      resources: ["*"],
    }),
  ],
});

// apply the policy to the authenticated and unauthenticated roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  pinpointPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  pinpointPolicy
);
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  appSyncAllPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  appSyncAllPolicy
);

backend.addOutput({
  notifications: {
    aws_region: Stack.of(pinpointApp).region,
    amazon_pinpoint_app_id: pinpointApp.ref,
    channels: ["APNS"],
  },
});
