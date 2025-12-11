import {
  LocationClient,
  PutGeofenceCommand,
  ListGeofencesCommand,
  SearchPlaceIndexForTextCommand,
  PutGeofenceCommandInput,
} from "@aws-sdk/client-location";
import type { SafeZone, Circle, Location } from "../../data/resource";

const client = new LocationClient();

//?: Function to create a circle geofence around a specific location
export async function createCircleGeofence(
  geofenceCollectionName: string,
  geofenceId: string,
  centerlnggitude: number,
  centerLatitude: number,
  radiusInMeters: number
) {
  try {
    // Define the geofence parameters
    const params: PutGeofenceCommandInput = {
      CollectionName: geofenceCollectionName,
      GeofenceId: geofenceId,
      Geometry: {
        Circle: {
          Center: [centerlnggitude, centerLatitude], // lnggitude comes first in AWS SDK
          Radius: radiusInMeters, // Radius in meters
        },
      },
    };

    // Create the command to put (create) a geofence
    const command = new PutGeofenceCommand(params);

    // Send the command to AWS Location Service
    const response = await client.send(command);
    // Return success message and geofence data
    console.log("Geofence created successfully:", response);
    return response;
  } catch (error) {
    console.error("Error creating geofence:", error);
    throw error;
  }
}

//?: Get the address' lnggitude and latitude
export const get_coordinates_from_address = async (
  address: string
): Promise<{ lng: number; lat: number } | null> => {
  const params = {
    IndexName: "ENTER_YOUR_PLACE_INDEX_NAME_HERE", // Create in AWS Location Service > Place indexes
    Text: address,
  };

  try {
    const command = new SearchPlaceIndexForTextCommand(params);
    const response = await client.send(command);

    if (
      response.Results &&
      response.Results.length > 0 &&
      response.Results[0]?.Place?.Geometry?.Point
    ) {
      const coordinates = response.Results[0].Place.Geometry?.Point;
      if (coordinates) {
        // console.log(
        //   `${address}\n Coordinates: lnggitude ${coordinates[0]}, Latitude ${coordinates[1]}`
        // );
        return { lng: coordinates[0], lat: coordinates[1] };
      }
    }
    return null;
  } catch (error) {
    console.error("Error fetching geolocation:", error);
    return null;
  }
};

//? to determain if cordinate inside geofene or not
export function check_for_known_location(
  point: { lat: number; lng: number },
  safe_zones: SafeZone[]
): string {
  // Return the first safe zone id that includes this coordinate

  for (const safe_zone of safe_zones) {
    if (safe_zone.circle && isPointInCircle(point, safe_zone.circle)) {
      console.log(
        "found cordinate",
        point,
        "inside CIRCLE",
        safe_zone.circle,
        `in ${safe_zone.location_name}`
      );
      return safe_zone.id;
    }
    if (
      safe_zone.polygon &&
      isPointInPolygon(point, safe_zone.polygon as Location[])
    ) {
      console.log(
        `found cordinate ${point} inside POLYGON ${safe_zone.polygon}\n in ${safe_zone.location_name}`
      );
      return safe_zone.id;
    }
  }
  return ""; // out from all safezones
}
function isPointInCircle(
  point: { lat: number; lng: number },
  circle: Circle
): boolean {
  const earthRadiusKm = 6371; // Radius of the Earth in kilometers

  const dLat = degreesToRadians(circle.center.latitude - point.lat);
  const dLng = degreesToRadians(circle.center.longitude - point.lng);

  const lat1 = degreesToRadians(point.lat);
  const lat2 = degreesToRadians(circle.center.latitude);

  // Haversine formula to calculate the great-circle distance
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = earthRadiusKm * c; // Distance in kilometers
  const radiusInKm = circle.radius / 1000; // Convert circle radius to kilometers

  // console.log(
  //   `Distance calculated: ${distance} km, Circle radius: ${radiusInKm} km. for circle raius ${circle.radius}`
  // );

  return distance <= radiusInKm;
}

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function isPointInPolygon(
  point: { lat: number; lng: number },
  polygon: Location[]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;

    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

//?: Function to list all geofences in a collection
async function listAllGeofences(geofenceCollectionName: string) {
  try {
    // Define parameters for the ListGeofencesCommand
    const params = {
      CollectionName: geofenceCollectionName,
    };

    // Create a new command to list geofences
    const command = new ListGeofencesCommand(params);

    // Send the command to AWS Location Service
    const response = await client.send(command);

    // Return the list of geofences
    return response;
  } catch (error) {
    console.error("Error listing geofences:", error);
    throw error;
  }
}
