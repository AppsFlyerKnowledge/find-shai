import type { Handler } from "aws-lambda";
import type {
  Schema,
  SafeZone,
  CalendarEvent,
  LovedOne,
} from "../../data/resource";
import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";
import outputs from "../../../amplify_outputs.json";
import { listEvents } from "./calendar_events";
import {
  unlinkEventsFromSafeZones,
  linkEventsToSafeZones,
  createSafeZoneByLocationName,
  check_for_safe_zone_with_location_name,
} from "./utils";
import {
  get_coordinates_from_address,
  check_for_known_location,
  createCircleGeofence,
} from "./geofence";

const appsync_client = generateClient<Schema>({
  authMode: "iam",
});

Amplify.configure(outputs);

export const handler: Handler = async (event) => {
  console.log(event);
  try {
    let user_id = event["user_id"];
    if (!user_id || user_id == "") {
      user_id = event["arguments"]["user_id"];
    }

    // Delete events from DynamoDB and unlink from SafeZones.
    // Fetch new events from Google Calendar and associate them with SafeZones.
    // Delete orphaned SafeZones that don't link to any events.

    // loved one data
    let loved_one_data = await fetch_user_from_dynamodb(user_id);

    let safe_zones = loved_one_data?.safe_zones as SafeZone[];
    console.log(
      "Current Loved one safe zones - before update:\n\n",
      safe_zones
    );

    let events = loved_one_data?.calander_events;

    console.log("Current Loved one events - before update:\n\n", events);
    let updated_events: CalendarEvent[] = [];

    const currentTime = new Date().getTime();

    // delete all events from google calendar for loved one, (or these from app that their date passed)

    let events_ids_need_to_be_un_linked = [];

    for (const event of events) {
      if (event?.is_from_google_calendar) {
        events_ids_need_to_be_un_linked.push(event.id);
        // not added to updated_events = deleted
      } else if (event) {
        // for case event is not from google calendar - dont want to delete it, unless his date passed
        const eventEndTime = new Date(event.end_time).getTime();

        // won't add the the event if his date passed
        if (eventEndTime < currentTime) {
          events_ids_need_to_be_un_linked.push(event.id);
        } else updated_events.push(event);
      }
    }

    console.log(
      "events REMINED agter delete all events from gogle calendaer, or from app and their time passed:",
      updated_events
    );

    // Unlink events from safe zones
    safe_zones = unlinkEventsFromSafeZones(
      safe_zones,
      events_ids_need_to_be_un_linked
    );

    // fetch events from google calendar and create geofence or links betwen exists safe zones
    // HARDCODED iCal URL - all caregivers see this calendar
    // Example: https://calendar.google.com/calendar/ical/YOUR_CALENDAR_ID/private-YOUR_PRIVATE_KEY/basic.ics
    const HARDCODED_ICAL_URL = "ENTER_YOUR_ICAL_URL_HERE";
    const calendar_token = HARDCODED_ICAL_URL;
    if (calendar_token) {
      let google_calendar_events = await listEvents(calendar_token);

      console.log(
        "Polled the events from google calendar succesfully:",
        google_calendar_events,
        `amount of events: ${google_calendar_events.length}`
      );

      let need_to_be_linked: { safeZoneID: string; eventIDs: string[] }[] = [];

      const geofence_radius = 500; // Always use 500m for easier testing
      
      // Use the shared geofence collection for all users
      // Your geofence collection name from AWS Location Service
      const HARDCODED_GEOFENCE_COLLECTION = "ENTER_YOUR_GEOFENCE_COLLECTION_HERE";
      const geofenceCollectionName = HARDCODED_GEOFENCE_COLLECTION;
      
      console.log("Using geofence collection:", geofenceCollectionName);

      for (let event of google_calendar_events) {
        if (event?.location_name) {
          // check if geofence already exists by location name
          const safe_zone_id = check_for_safe_zone_with_location_name(
            event.location_name,
            safe_zones
          );
          //! in case LOCATION NAME FOUND IN SAFE ZONES -
          if (safe_zone_id) {
            // Link the existing safe zone ID to the event
            console.log(
              "location name",
              event.location_name,
              "already exist in geofence with id",
              safe_zone_id
            );

            event.safe_zone_id = safe_zone_id;

            // Use the helper function to add the event ID to the linking list
            addEventToLinkingList(need_to_be_linked, safe_zone_id, event.id);
            updated_events.push(event);
            console.log("updated events for now:\n\n", updated_events);
          }
          //! in case THERE IS NO SAFE ZONE CONTAINING THE EVENT'S LOCATION NAME:
          else {
            // create CORDINATE (point) by this location name, loop through all safe zones, if the cordinate inside one of the safe zones - link the event to this safe zone, and keep to link it from safe zone too
            console.log(
              `No safe zone with location name ${event.location_name} found for this event, creating cordinate and checking by location:`
            );
            const location_cordinate = await get_coordinates_from_address(
              event.location_name
            );

            // address name was not valid
            if (!location_cordinate) {
              console.error(
                `Error: No location cordinate found for address "${event.location_name}".\nmoving to the next event`
              );
              continue;
            }
            console.log(
              `checking if location exists in safe zones by cordinate: lnggitude ${location_cordinate.lng}, Latitude ${location_cordinate.lat}`
            );

            const known_loaction_id = await check_for_known_location(
              location_cordinate,
              safe_zones
            );

            //! cordinate found in existing safe zone - linkbetween them
            if (known_loaction_id != "") {
              console.log(
                `cordinate found in existing safe zone ${known_loaction_id}, now linking betwen the event to the known location:`
              );

              event.safe_zone_id = known_loaction_id;

              addEventToLinkingList(
                need_to_be_linked,
                known_loaction_id,
                event.id
              );
              updated_events.push(event);
              console.log("updated events for now:\n\n", updated_events);
            } else {
              //! case no safezone found for this cordinate
              console.log(
                `NO cordinate found in existing safe zone creating new safe zone in circle:`
              );
              // create new safe zone - circle (also creates geofence in AWS Location Service)
              const newSafeZone = await createSafeZoneByLocationName(
                event.location_name,
                event.id,
                geofence_radius,
                geofenceCollectionName
              );

              if (newSafeZone) {
                console.log(
                  `new safe zone in circle created for location name ${event.location_name} is:\n ${newSafeZone?.id}`
                );
                safe_zones.push(newSafeZone);
                console.log("updated safe zones:", safe_zones.toString());
                // link the safe zone to the event
                event.safe_zone_id = newSafeZone.id;
                updated_events.push(event);
                console.log("updated events for now:\n\n", updated_events);
              }
            }
          }
        }
      }

      console.log(
        "events after added from google calendar - should be with links to geofences:\n\n",
        updated_events
      );
      // After looping through all events, link them to the safe zones

      console.log(
        "safe zones BEFORE link every google calendar event to EXIST safe zone: (and after added new geofence with link id if needed)",
        safe_zones
      );

      safe_zones = linkEventsToSafeZones(need_to_be_linked, safe_zones);

      console.log(
        "safe zones AFTER link every event to exist or new safe zone:",
        safe_zones
      );
    }
    // in case no google_calendar_ token exist:
    else {
      console.log(
        "Google calendar token is missing, no load happend, just delte of events and thier links till now..."
      );
    }

    console.log("safezones BEFORE delete:", safe_zones);

    let safe_zones_amount_before_delete = safe_zones.length;

    // to delete it if it not pointing any event
    safe_zones = safe_zones.filter(
      (safeZone) =>
        safeZone.calender_events.length > 0 ||
        safeZone.is_custom_location ||
        safeZone.location_name === "home"
    );

    console.log(
      "safezones AFTER delete:",
      safe_zones_amount_before_delete === safe_zones.length
        ? `NO SAFE ZONE DELETED, same length before and after: ${safe_zones_amount_before_delete}`
        : `${
            safe_zones_amount_before_delete - safe_zones.length
          } safe zones have been deleted. new safe zones:`,
      safe_zones
    );

    // Ensure all safe zones have corresponding geofences in AWS Location Service
    // This handles safe zones that were created before geofence sync was added
    const HARDCODED_GEOFENCE_COLLECTION = "ENTER_YOUR_GEOFENCE_COLLECTION_HERE";
    const geofence_radius = 500; // Always use 500m for easier testing
    
    console.log("Syncing safe zones to AWS Location Service geofences...");
    for (const safeZone of safe_zones) {
      if (safeZone.circle && safeZone.circle.center) {
        try {
          await createCircleGeofence(
            HARDCODED_GEOFENCE_COLLECTION,
            safeZone.id,
            safeZone.circle.center.longitude,
            safeZone.circle.center.latitude,
            geofence_radius // Always use 500m
          );
          console.log(`✅ Geofence synced for: ${safeZone.location_name} (ID: ${safeZone.id})`);
        } catch (error: any) {
          // If geofence already exists, that's fine - just log it
          if (error.name === 'ConflictException') {
            console.log(`ℹ️ Geofence already exists: ${safeZone.location_name} (ID: ${safeZone.id})`);
          } else {
            console.error(`❌ Error creating geofence for ${safeZone.location_name}:`, error);
          }
        }
      }
    }
    console.log("Geofence sync complete!");

    //update loved one data - events and safe zones

    await appsync_client.models.LovedOne.update({
      id: user_id,
      safe_zones: safe_zones,
      calander_events: updated_events,
    });
    return "calendar success";
  } catch (error) {
    console.error("Error:", error);
    return error;
  }
};

export async function fetch_user_from_dynamodb(
  user_id: string
): Promise<LovedOne> {
  return new Promise(async (resolve, reject) => {
    if (!user_id || user_id == "") {
      reject("empty user_id");
    }

    console.log('fetching user for id ', user_id)

    try {
      const result = await appsync_client.models.LovedOne.get({
        id: user_id,
      });
      console.log("resulr before check:", result);

      console.log(result)
      
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

// Function to add event ID to the linking list for a specific safe zone
function addEventToLinkingList(
  need_to_be_linked: { safeZoneID: string; eventIDs: string[] }[],
  safeZoneID: string,
  eventID: string
) {
  // Check if the safe zone ID is already in the array
  const linkAlreadyExist = need_to_be_linked.find(
    (link) => link.safeZoneID === safeZoneID
  );

  if (linkAlreadyExist) {
    // If it exists, add the event ID to its list if it's not already present
    if (!linkAlreadyExist.eventIDs.includes(eventID)) {
      linkAlreadyExist.eventIDs.push(eventID);
    }
  } else {
    // If it doesn't exist, create a new entry
    need_to_be_linked.push({
      safeZoneID: safeZoneID,
      eventIDs: [eventID],
    });
  }
}
