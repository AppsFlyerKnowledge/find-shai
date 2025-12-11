import { CalendarEvent, Caregiver, SafeZone } from "../../data/resource";

export function get_ongoing_event(
  calendar_events: CalendarEvent[],
  time_happend: number
): CalendarEvent | null {
  const now = time_happend;

  // Loop through events
  for (const event of calendar_events) {
    // Check if now is after start and before end + delta
    if (
      now >= Date.parse(event.start_time) - (event.custom_buffer_time || 0) &&
      now <= Date.parse(event.end_time) + (event.custom_buffer_time || 0)
    ) {
      console.log("on going event has been found:", event);
      return event; // Return the ongoing event
    }
  }

  return null;
}

export const get_safe_zone_by_id = (
  safe_zones: SafeZone[],
  geofence_id: string
): SafeZone => {
  console.log("safe zones:", safe_zones);
  safe_zones.filter((event) => event !== null && event !== undefined);

  const safe_zone = safe_zones.find((zone) => zone.id === geofence_id);

  console.log("the safe zone by id:", geofence_id, "is:", safe_zone);

  return safe_zone as SafeZone;
};

// Determine if a notification should be sent
export function checkUserPreferences(
  care_giver: Caregiver,
  time_happened: string,
  expected_start_time: string,
  expected_end_time: string
): { shouldSendNotification: boolean; isAsExpected: boolean } {
  if (!care_giver.should_send_messages) {
    console.log(`User ${care_giver.name} prefers to mute messages`);
    return { shouldSendNotification: false, isAsExpected: false };
  }

  const happenedTime = Date.parse(time_happened);
  const time_buffer = care_giver.time_buffer || 0;

  // Check if the time falls within any quiet hours
  const isInQuietHours = checkIfInQuietHours(
    care_giver,
    happenedTime,
    time_buffer
  );
  if (isInQuietHours) {
    console.log(
      `User ${care_giver.name} prefers to mute messages during these quiet hours`
    );
    return { shouldSendNotification: false, isAsExpected: false };
  }

  // Check if the event is as expected based on start and end times
  const isAsExpectedResult = isAsExpected(
    time_happened,
    expected_start_time,
    expected_end_time
  );

  return {
    shouldSendNotification: true,
    isAsExpected: isAsExpectedResult,
  };
}

// Helper function to check if the time is within quiet hours
function checkIfInQuietHours(
  care_giver: Caregiver,
  happenedTime: number,
  time_buffer: number
): boolean {
  const quiet_hours = care_giver?.quite_hours || [];

  if (quiet_hours.length > 0) {
    for (const quiet_hour of quiet_hours) {
      const startTime =
        Date.parse(quiet_hour?.start_time || "") - time_buffer * 60 * 1000;
      const endTime =
        Date.parse(quiet_hour?.end_time || "") + time_buffer * 60 * 1000;

      if (happenedTime >= startTime && happenedTime <= endTime) {
        console.log(
          `Time ${new Date(
            happenedTime
          ).toISOString()} is within quiet hours from ` +
            `${new Date(startTime).toISOString()} to ${new Date(
              endTime
            ).toISOString()}`
        );
        return true;
      }
    }
  }
  return false;
}

// Helper function to check if the time is within the expected range
function isAsExpected(
  time_happened: string,
  expected_start_time: string,
  expected_end_time: string
): boolean {
  const happenedTime = Date.parse(time_happened);
  const startTime = Date.parse(expected_start_time);
  const endTime = Date.parse(expected_end_time);

  // Check if happenedTime is within the expected start and end range
  const isWithinRange = happenedTime >= startTime && happenedTime <= endTime;
  console.log(
    `Time ${new Date(happenedTime).toISOString()} is ${
      isWithinRange ? "within" : "outside"
    } the expected range from ${new Date(
      startTime
    ).toISOString()} to ${new Date(endTime).toISOString()}`
  );
  return isWithinRange;
}

// Build the notification message
export function buildNotificationMessage(
  event_type: string,
  location_name: string,
  loved_one_name: string
) {
  const enterType = event_type === "ENTER" ? "entered" : "exited";

  // Check if the location is 'home' to customize the message
  if (location_name.toLowerCase() === "home") {
    return `${loved_one_name} has ${enterType} home`;
  }

  // Otherwise, return the standard message
  return `${loved_one_name} has ${enterType} ${location_name}`;
}
