import type { SafeZone } from "../../data/resource";
import { v4 as uuidv4 } from "uuid";
import { get_coordinates_from_address, createCircleGeofence } from "./geofence";

export function unlinkEventsFromSafeZones(
  safe_zones: SafeZone[],
  event_ids: string[]
): SafeZone[] {
  // Iterate over all safe zones and unlink the specified event IDs
  return safe_zones.map((safeZone) => {
    if (safeZone && safeZone.calender_events) {
      const filteredEventsIds = safeZone.calender_events.filter(
        (eventId) => eventId && !event_ids.includes(eventId)
      );

      return {
        ...safeZone,
        calender_events: filteredEventsIds,
      };
    }
    return safeZone;
  });
}

export function check_for_safe_zone_with_location_name(
  location_name: string,
  safe_zones: SafeZone[]
): string | null {
  // If location_name is null, return null immediately
  if (!location_name) {
    return null;
  }

  // Check for an existing safe zone with the same location name
  const existingSafeZone = safe_zones.find(
    (safeZone) => safeZone.location_name === location_name
  );

  // If found, return the safe zone ID; otherwise, return null
  return existingSafeZone ? existingSafeZone.id : null;
}

export function linkEventsToSafeZones(
  links: { safeZoneID: string; eventIDs: string[] }[],
  safe_zones: SafeZone[]
): SafeZone[] {
  links.forEach((link) => {
    const safeZone = safe_zones.find((zone) => zone.id === link.safeZoneID);
    if (safeZone) {
      // Add each event ID to the safe zone's calendar events
      link.eventIDs.forEach((eventID) => {
        if (!safeZone.calender_events.includes(eventID)) {
          safeZone.calender_events.push(eventID);
        }
      });
      console.log(
        `Linked events ${link.eventIDs.join(", ")} to safe zone ${
          link.safeZoneID
        }.`
      );
    } else {
      console.log(`Safe zone with ID ${link.safeZoneID} not found.`);
    }
  });

  // Return the updated safe_zones array
  return safe_zones;
}

export async function createSafeZoneByLocationName(
  locationName: string,
  eventId: string,
  geofence_radius: number,
  geofenceCollectionName?: string
): Promise<SafeZone | null> {
  // Fetch geolocation for the given location name
  const location = await get_coordinates_from_address(locationName);

  if (location) {
    const longitude = location.lng;
    const latitude = location.lat;
    const radius = geofence_radius;

    console.log(
      "Longitude: ",
      longitude,
      "Latitude: ",
      latitude,
      "Radius: ",
      radius
    );

    const newGeofenceId = uuidv4();

    // Create the actual geofence in AWS Location Service if collection name is provided
    if (geofenceCollectionName) {
      try {
        await createCircleGeofence(
          geofenceCollectionName,
          newGeofenceId,
          longitude,
          latitude,
          radius
        );
        console.log(`Geofence created in AWS Location Service: ${newGeofenceId}`);
      } catch (error) {
        console.error("Error creating geofence in AWS Location Service:", error);
        // Continue anyway - we'll still create the safe zone in DynamoDB
      }
    } else {
      console.warn("No geofence collection name provided - geofence not created in AWS Location Service");
    }

    // Define the new safe zone object
    const newSafeZone: SafeZone = {
      id: newGeofenceId,
      polygon: null,
      circle: {
        radius: radius,
        center: {
          latitude: latitude,
          longitude: longitude,
        },
      },
      location_name: locationName,
      is_custom_location: false,
      calender_events: [eventId],
      is_home: false
    };
    console.log("new safe zone created:", newSafeZone);

    return newSafeZone;
  } else {
    console.error("Could not fetch location for:", locationName);
    return null;
  }
}
