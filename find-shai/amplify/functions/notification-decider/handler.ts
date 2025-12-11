import type { Handler } from "aws-lambda";
import type {
  Schema,
  LovedOne,
  SafeZone,
  Caregiver,
} from "../../data/resource";
import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";
import outputs from "../../../amplify_outputs.json";
import { pushNotificationToApp } from "./pushNotification";
import {
  buildNotificationMessage,
  get_ongoing_event,
  checkUserPreferences,
  get_safe_zone_by_id,
} from "./utils";

const client = generateClient<Schema>({ authMode: "iam" });
Amplify.configure(outputs);

// HARD CODED - Device and User mapping
const HARDCODED_CONFIG = {
  UserId: "ENTER_YOUR_LOVED_ONE_ID_HERE",
  DeviceId: "ENTER_YOUR_DEVICE_ID_HERE"
};

// Map device IDs to loved one IDs
// This allows the watch to use a simple device ID while the backend maps it to the actual loved one
const DEVICE_TO_LOVED_ONE_MAP: { [key: string]: string } = {
  [HARDCODED_CONFIG.DeviceId]: HARDCODED_CONFIG.UserId,
};

export const handler: Handler = async (event) => {
  console.log("Notification decider triggered:", JSON.stringify(event));
  try {
    // check if event exists for loved one in this time
    // get the location name
    // build the meesage
    // upload to notifications DB
    // send push notifcation to the phone
    
    // AWS Location Service uses different field names (PascalCase)
    // DeviceId should be the loved_one_id (set when updating device position)
    const { DeviceId, GeofenceId, Position, EventType } = event.detail;
    
    // Map device ID to loved one ID (or use DeviceId directly if no mapping exists)
    const loved_one_id = DEVICE_TO_LOVED_ONE_MAP[DeviceId] || DeviceId;
    console.log(`Mapped DeviceId "${DeviceId}" to loved_one_id "${loved_one_id}"`);
    const geofence_id = GeofenceId;
    const position = Position;
    const event_type = EventType;

    const time_happend = Date.now();

    console.log(
      `loved one id: ${loved_one_id}, geofence id: ${geofence_id}, time happened: ${time_happend}, position: ${position}, event type: ${event_type}`
    );

    const loved_one_user_data = await fetch_user_from_dynamodb(loved_one_id);

    const calendar_events = loved_one_user_data.calander_events.filter(
      (event) => event !== null && event !== undefined
    );

    const ongoingEvent = get_ongoing_event(calendar_events, time_happend);

    if (!ongoingEvent) {
      console.log(
        "no on going event, the function triggered from geofence but not in existing event"
      );
      return;
    }

    // Log debug info
    console.log(`Triggered geofence_id: ${geofence_id}`);
    console.log(`Ongoing event: ${ongoingEvent.event_name}, safe_zone_id: ${ongoingEvent.safe_zone_id}`);

    // IMPORTANT: Only send notification if the triggered geofence matches the ongoing event's expected location
    // This prevents notifications when entering/exiting unrelated geofences
    if (geofence_id !== ongoingEvent.safe_zone_id) {
      console.log(
        `Triggered geofence (${geofence_id}) does not match ongoing event's expected safe zone (${ongoingEvent.safe_zone_id}). Skipping notification.`
      );
      return;
    }

    // Combine all safe zones including home for lookup
    const all_safe_zones = [
      ...(loved_one_user_data.safe_zones || []),
      ...(loved_one_user_data.home ? [loved_one_user_data.home] : [])
    ] as SafeZone[];

    // Find the safe zone for this geofence
    const safe_zone = get_safe_zone_by_id(
      all_safe_zones,
      geofence_id
    );

    if (!safe_zone) {
      console.log(
        `Safe zone with id ${geofence_id} not found in safe_zones or home`
      );
      return;
    }

    const location_name = safe_zone.location_name;

    console.log("location name: " + location_name);

    const care_givers = await get_care_givers(loved_one_user_data);

    for (const care_giver of care_givers) {
      // Check if the event should trigger a notification based on caregiver preferences
      const { shouldSendNotification, isAsExpected } = checkUserPreferences(
        care_giver,
        new Date(time_happend).toISOString(),  // Convert timestamp to ISO string
        ongoingEvent.end_time,
        ongoingEvent.start_time
      );

      // Build the message
      const message_text = buildNotificationMessage(
        event_type,
        location_name,
        loved_one_user_data.name || ""
      );

      console.log("the message is:", message_text)

      // Check for duplicate notifications (same caregiver, event_type, location within last 60 seconds)
      const recentNotifications = await client.models.Notification.list({
        filter: {
          caregiver_id: { eq: care_giver.id },
          event_type: { eq: event_type },
          location_name: { eq: location_name }
        }
      });
      
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const isDuplicate = recentNotifications.data?.some(
        (n) => n.createdAt && n.createdAt > oneMinuteAgo
      );
      
      if (isDuplicate) {
        console.log("Skipping duplicate notification - similar notification created within last 60 seconds");
        continue;
      }


      if (shouldSendNotification) {
        // Push message to the user's application
        await pushNotificationToApp(care_giver.id, message_text);
        console.log("send push notfication");
      } else {
        console.log("DONT send push notfication but write to DB");
      }

      // Write notification to the notification DB with TTL
      const ttl = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days in seconds from now
      const result = await client.models.Notification.create({
        message: message_text,
        event_type: event_type, // ENTER or EXIT
        ttl: ttl,
        is_as_expected: isAsExpected,
        geofence_id: geofence_id,
        caregiver_id: care_giver.id,
        location_name: location_name,
        longitude: position[0],
        latitude: position[1],
        calander_event: ongoingEvent,
        safe_zone: safe_zone,
      });

      console.log("Notification created:", result.data);
    }
  } catch (error) {
    console.error("Error processing event:", error);
  }

  return "notifcation decider success!";
};

async function fetch_user_from_dynamodb(user_id: string): Promise<LovedOne> {
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
