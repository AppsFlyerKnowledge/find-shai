import type { Handler } from "aws-lambda";
import type { Schema, LovedOne, Caregiver } from "../../data/resource";
import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";
import outputs from "../../../amplify_outputs.json";
import {
  LocationClient,
  DeleteGeofenceCollectionCommand,
  DeleteTrackerCommand,
} from "@aws-sdk/client-location";
import {
  EventBridgeClient,
  DeleteRuleCommand,
  RemoveTargetsCommand,
} from "@aws-sdk/client-eventbridge";

const client = generateClient<Schema>({ authMode: "iam" });
Amplify.configure(outputs);
const location_client = new LocationClient({});
const event_bridge_client = new EventBridgeClient({});

// for loved one - need to delete geofence collection, tracker, event bridge, associate, and data and link to the care givers
// for caregiver need to delete data and notifications and links to the loved one

export const handler: Handler = async (event) => {
  console.log(event);
  const user_id = event["userID"];
  const type = event["request"]["userAttributes"]["preferred_username"];

  if (!user_id) {
    console.log("user id required");
    return;
  }

  const isLovedOne = type === "lovedone";

  try {
    if (isLovedOne) {
      console.log("removing loved-one user id:", user_id);

      const loved_one_data = await fetch_loved_one_from_dynamodb(user_id);

      console.log("loved one data:", loved_one_data);

      if (!loved_one_data) {
        console.error("user data not found");
        return;
      }

      const g_c_arn = loved_one_data.geofence_collection_arn;
      await deleteGeofenceCollection(g_c_arn);

      const tracker = loved_one_data.tracker_arn;
      await deleteTracker(tracker);

      await delete_event_bridge("event-bridge" + loved_one_data.id);

      const care_givers = await get_care_givers(loved_one_data);

      for (const care_giver of care_givers) {
        console.log("removing caregiver id:", care_giver.id);
        await delete_link_of_care_giver(care_giver.id);
      }

      await delete_loved_one_from_dynamodb(loved_one_data.id);

      console.log("delete loved one - done");
    } else {
      // case for care giver
      //   await delete_caregiver_notifications(user_id);
      await delete_care_giver_from_dynamodb(user_id);
    }
  } catch (error) {
    console.error("Error deleting user:", error);
  }

  console.log("delete user success");

  return event;
};

async function fetch_loved_one_from_dynamodb(
  user_id: string
): Promise<LovedOne> {
  return new Promise(async (resolve, reject) => {
    if (!user_id || user_id == "") {
      reject("empty user_id");
    }

    try {
      const result = await client.models.LovedOne.get({
        id: user_id,
      });
      console.log("result before check:", result);

      if (result && result.data) {
        resolve(result.data);
      }

      reject("user not found");
    } catch (error) {
      console.error("Error fetching user:", error);
      reject(error);
    }
  });
}

async function delete_loved_one_from_dynamodb(user_id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await client.models.LovedOne.delete({
        id: user_id,
      });
      console.log("loved one deleted succssfully", result);

      if (result && result.data) {
        resolve();
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      reject(error);
    }
  });
}

const deleteGeofenceCollection = async (
  collectionName: string
): Promise<void> => {
  try {
    if (!collectionName) {
      console.error("Geofence collection name missing:", collectionName);
      return;
    }
    const command = new DeleteGeofenceCollectionCommand({
      CollectionName: collectionName,
    });
    const response = await location_client.send(command);
    console.log("Geofence collection deleted successfully:", response);
  } catch (error) {
    console.error("Error deleting geofence collection:", error);
  }
};

const deleteTracker = async (trackerName: string): Promise<void> => {
  try {
    if (!trackerName) {
      console.error("Tracker name is missing:", trackerName);
      return;
    }
    const command = new DeleteTrackerCommand({
      TrackerName: trackerName,
    });
    const response = await location_client.send(command);
    console.log("Tracker deleted successfully:", response);
  } catch (error) {
    console.error("Error deleting tracker:", error);
  }
};

async function get_care_givers(loved_one_data: LovedOne): Promise<Caregiver[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await loved_one_data.caregivers.call({
        loved_one_id: loved_one_data.id,
      });

      console.log("result before check:", result);

      if (result && result.data) {
        console.log("care givers found:", result.data);
        resolve(result.data);
      }

      reject("care givers not fount for this loved one");
    } catch (error) {
      console.error("Error fetching caregivers:", error);
      reject(error);
    }
  });
}

const delete_link_of_care_giver = async (
  caregiverId: string
): Promise<void> => {
  try {
    // Update `loved_one_id` field to null for the specified caregiver
    const result = await client.models.Caregiver.update({
      id: caregiverId,
      loved_one_id: "none",
    });

    if (!result.data) {
      console.error("Caregiver not found or already unlinked.");
      return;
    }

    console.log(
      "Caregiver link to loved one removed successfully for caregiver ID:",
      caregiverId
    );
  } catch (error) {
    console.error(
      "Error deleting caregiver link to loved one for caregiver ID:",
      caregiverId,
      error
    );
  }
};

const delete_event_bridge = async (
  ruleName: string,
  eventBusName?: string
): Promise<void> => {
  try {
    // Remove all targets associated with the rule before deleting it
    await event_bridge_client.send(
      new RemoveTargetsCommand({
        Rule: ruleName,
        EventBusName: eventBusName,
        Ids: ["*"], // '*' removes all targets
      })
    );

    // Set up the delete rule command with optional event bus name and force deletion
    const command = new DeleteRuleCommand({
      Name: ruleName,
      EventBusName: eventBusName,
      Force: true, // Force deletion of rule and associated targets
    });

    // Execute the delete command
    await event_bridge_client.send(command);
    console.log(`EventBridge rule "${ruleName}" deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting EventBridge rule "${ruleName}":`, error);
  }
};

const delete_caregiver_notifications = async (
  caregiverId: string
): Promise<void> => {
  try {
    // Load notifications associated with the specified caregiver ID
    // const notifications = await client.models.Notification.findAll({
    //   caregiver_id: caregiverId,
    // });
    // // Check if any notifications were found
    // if (notifications.length === 0) {
    //   console.error("No notifications found for caregiver ID:", caregiverId);
    //   return;
    // }
    // Assuming you want to update the notifications to remove or nullify any specific fields
    // const updatePromises = notifications.map((notification) => {
    //   return client.models.Notification.update({
    //     id: notification.id, // Assuming each notification has an 'id' field
    //     // Set fields to null or remove as needed
    //     fieldToUpdate: null, // Replace 'fieldToUpdate' with the actual field name you want to update
    //   });
    // });
    // Wait for all update operations to complete
    // await Promise.all(updatePromises);
    // console.log(
    //   "Caregiver notifications updated successfully for caregiver ID:",
    //   caregiverId,
    //   "Updated count:",
    //   notifications.length
    // );
  } catch (error) {
    console.error(
      "Error deleting notifications for caregiver ID:",
      caregiverId,
      error
    );
  }
};

async function delete_care_giver_from_dynamodb(user_id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await client.models.Caregiver.delete({
        id: user_id,
      });
      console.log("caer giver deleted succssfully", result);

      if (result && result.data) {
        resolve();
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      reject(error);
    }
  });
}
