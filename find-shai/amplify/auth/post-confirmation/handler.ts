import type { Handler } from "aws-lambda";
import type { Schema } from "../../data/resource";
import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";
import {
  LocationClient,
  CreateGeofenceCollectionCommand,
  CreateTrackerCommand,
  AssociateTrackerConsumerCommand,
  CreateTrackerCommandInput,
  AssociateTrackerConsumerCommandInput,
  CreateGeofenceCollectionCommandInput,
} from "@aws-sdk/client-location";
import {
  EventBridgeClient,
  PutRuleCommand,
  PutTargetsCommand,
} from "@aws-sdk/client-eventbridge";
import { LambdaClient, AddPermissionCommand } from "@aws-sdk/client-lambda";
import outputs from "../../../amplify_outputs.json";

Amplify.configure(outputs);
const client = generateClient<Schema>();
const location_client = new LocationClient({});
const event_bridge_client = new EventBridgeClient();
const lambdaClient = new LambdaClient({});

// HARDCODED loved one - all caregivers are automatically linked to this one
const HARDCODED_LOVED_ONE_ID = "ENTER_YOUR_LOVED_ONE_ID_HERE";

export const handler: Handler = async (event) => {
  console.log(event);

  // Check if this is a direct invocation (from CreateUserFunction) or Cognito trigger
  const isDirectInvocation = event["arguments"] && event["arguments"]["user_data"];
  
  let user_id: string;
  let user_email: string;
  let given_name: string;
  let type: string;
  let calendar_token: string = "none";
  
  if (isDirectInvocation) {
    // Handle direct invocation - parse user_data JSON string
    try {
      const userData = JSON.parse(event["arguments"]["user_data"]);
      user_id = userData.user_id;
      user_email = userData.email;
      given_name = userData.given_name;
      type = userData.type;
      calendar_token = userData.calendar_token || "none";
    } catch (error) {
      console.error("Error parsing user_data:", error);
      throw new Error("Invalid user_data format. Expected JSON string with: user_id, email, given_name, type");
    }
  } else {
    // Handle Cognito post-confirmation trigger
    user_id = event["userName"];
    user_email = event["request"]["userAttributes"]["email"];
    given_name = event["request"]["userAttributes"]["given_name"];
    type = event["request"]["userAttributes"]["preferred_username"];
  }
  
  const isLovedOne = type === "lovedone";

  try {
    if (isLovedOne) {
      console.log("creating a loved one");
      // Create geofence collection
      const collectionArn = await get_geofence_collection_arn(user_id);

      // Create tracker
      const trackerArn = await get_tracker_arn(user_id);

      // Associate tracker with grofence collection
      await associate_tracker_with_geo_collection(user_id, collectionArn);

      // Replace with your notification decider Lambda ARN from AWS Console
      const lambda_notif_decider_arn =
        "ENTER_YOUR_NOTIFICATION_LAMBDA_ARN_HERE";

      await create_event_bridge_rule(
        "event-bridge" + user_id,
        collectionArn,
        trackerArn,
        lambda_notif_decider_arn
      );

      const { data, errors } = await client.models.LovedOne.create({
        id: user_id,
        email: user_email,
        name: given_name,
        calander_token: calendar_token,
        calander_events: [],
        safe_zones: [],
        default_radius: 500,
        geofence_collection_arn: collectionArn,
        tracker_arn: trackerArn,
        known_locations: [],
      });

      if (errors) {
        console.error(errors);
      }

      console.log(data);
    } else {
      // case for careGiver - auto-link to hardcoded loved one
      const { data, errors } = await client.models.Caregiver.create({
        id: user_id,
        email: user_email,
        name: given_name,
        loved_one_id: HARDCODED_LOVED_ONE_ID,
        should_send_messages: true,
        send_just_if_not_exepected: false,
        location_update_frequent: 15,
        quite_hours: [],
        time_buffer: 0,
        push_token: null, // Will be updated when user logs in and registers for notifications
      });

      if (errors) {
        console.error(errors);
      }

      console.log(data);
    }
  } catch (error) {
    console.log("error creating user");
    console.error("Error creating user:", error);
  }

  console.log("create user success");

  return event;
};

const get_geofence_collection_arn = async (
  user_id: string
): Promise<string> => {
  // Create geofence collection
  return new Promise(async (resolve, reject) => {
    try {
      const geofenceInput: CreateGeofenceCollectionCommandInput = {
        CollectionName: user_id,
      };
      const geofenceCommand = new CreateGeofenceCollectionCommand(
        geofenceInput
      );
      const geofenceResponse = await location_client.send(geofenceCommand);
      if (geofenceResponse && geofenceResponse["CollectionArn"]) {
        console.log(
          "create geofence collection success ",
          geofenceResponse["CollectionArn"]
        );
        resolve(geofenceResponse["CollectionArn"]);
      }
      reject("geofence arn not defined");
    } catch (error) {
      reject(error);
    }
  });
};

const get_tracker_arn = async (user_id: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const trackerInput: CreateTrackerCommandInput = {
        TrackerName: user_id,
        PositionFiltering: "AccuracyBased",
      };
      const trackerCommand = new CreateTrackerCommand(trackerInput);
      const trackerResponse = await location_client.send(trackerCommand);
      if (trackerResponse && trackerResponse["TrackerArn"]) {
        console.log("create tracker success ", trackerResponse["TrackerArn"]);
        resolve(trackerResponse["TrackerArn"]);
      }
      reject("tracker arn not defined");
    } catch (error) {
      reject(error);
    }
  });
};

const associate_tracker_with_geo_collection = async (
  user_id: string,
  geofence_collection_arn: string
) => {
  // Links the geofence collection to the tracker.
  const input: AssociateTrackerConsumerCommandInput = {
    TrackerName: user_id,
    ConsumerArn: geofence_collection_arn,
  };
  const command = new AssociateTrackerConsumerCommand(input);
  await location_client.send(command);
};

const create_event_bridge_rule = async (
  ruleName: string,
  collectionArn: string,
  trackerArn: string,
  lambdaArn: string
): Promise<void> => {
  try {
    // Define the event pattern to capture events from the geofence collection and tracker
    const eventPattern = JSON.stringify({
      source: ["aws.geo"],
      detailType: ["Location Event"],
      detail: {
        collectionArn: [collectionArn],
        trackerArn: [trackerArn],
      },
    });

    // Step 1: Create the EventBridge rule
    const putRuleCommand = new PutRuleCommand({
      Name: ruleName,
      EventPattern: eventPattern,
      State: "ENABLED",
      Description:
        "Rule to trigger Lambda on geofence collection events associated with tracker",
    });

    const ruleResponse = await event_bridge_client.send(putRuleCommand);
    console.log("EventBridge rule created successfully:", ruleResponse.RuleArn);

    // Step 2: Add permission to allow EventBridge to invoke the Lambda function
    await lambdaClient.send(
      new AddPermissionCommand({
        FunctionName: lambdaArn,
        StatementId: `${ruleName}-invoke`,
        Action: "lambda:InvokeFunction",
        Principal: "events.amazonaws.com",
        SourceArn: ruleResponse.RuleArn,
      })
    );

    // Step 3: Set the Lambda function as the target for the rule
    const putTargetsCommand = new PutTargetsCommand({
      Rule: ruleName,
      Targets: [
        {
          Id: "notification_decider_target",
          Arn: lambdaArn,
        },
      ],
    });

    const targetsResponse = await event_bridge_client.send(putTargetsCommand);
    console.log(
      "Lambda function set as target for EventBridge rule:",
      targetsResponse
    );
  } catch (error) {
    console.error("Error creating EventBridge rule:", error);
  }
};
