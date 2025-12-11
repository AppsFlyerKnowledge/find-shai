import type { CalendarEvent } from "../../data/resource";
import ICAL from "ical.js";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// Initialize the Google Calendar API with a static token
// const calendar = google.calendar({
//   version: "v3",
//   auth: "AIzaSyBCdZ9j_C62ywTKdh8o7I5Zvwp7T9FP-LA",
// });

// Function to list Google Calendar events
export async function listEvents(
  calendar_token: string
): Promise<CalendarEvent[]> {
  try {
    const events = await downloadAndConvertICS(calendar_token);

    return events;
  } catch (error) {
    console.error("Got an error:", error);
    throw error;
  }
}

async function downloadAndConvertICS(icsURL: string): Promise<CalendarEvent[]> {
  try {
    // URL from the user DB
    const response = await axios.get(icsURL); // Fetch the ICS file
    const icsData: string = response.data;

    // Parse the ICS data
    const jcalData = ICAL.parse(icsData);
    const component = new ICAL.Component(jcalData);

    // Define the date range (today to 7 days after today)
    const currentDate = new Date();
    const timeMin = new Date(currentDate);
    const timeMax = new Date(currentDate);
    timeMax.setDate(currentDate.getDate() + 7); // Add 7 days
    timeMax.setHours(23, 59, 59, 999); // Set time to end of that day

    // Get all events
    const allEvents = component.getAllSubcomponents("vevent");

    // Extract and filter events within the specified date range
    const events: CalendarEvent[] = component
      .getAllSubcomponents("vevent")
      .map((event, index) => {
        const vevent = new ICAL.Event(event);
        
        console.log(`\n🔍 Event ${index + 1}:`, {
          summary: vevent.summary,
          location: vevent.location,
          startDate: vevent.startDate?.toJSDate().toISOString(),
          endDate: vevent.endDate?.toJSDate().toISOString(),
          hasLocation: !!vevent.location,
          locationIsURL: vevent.location ? /^https?:\/\//i.test(vevent.location) : false
        });

        if (
          vevent.location &&
          vevent.summary &&
          vevent.startDate &&
          vevent.endDate &&
          !/^https?:\/\//i.test(vevent.location)
        ) {
          console.log('✅ Event passed initial filters');
          return {
            id: uuidv4(),
            event_name: vevent.summary,
            start_time: vevent.startDate.toJSDate().toISOString(),
            end_time: vevent.endDate.toJSDate().toISOString(),
            custom_buffer_time: 0,
            mute_this_event: false,
            location_name: vevent.location,
            is_from_google_calendar: true,
            safe_zone_id: null,
          } as CalendarEvent;
        }
                return null;
      })
      .filter((event): event is CalendarEvent => event !== null)
      .filter((event) => {
        const eventStart = new Date(event.start_time);
        const isInRange = eventStart >= timeMin && eventStart <= timeMax;
        return isInRange;
      });

    return events;
  } catch (error) {
    return [];
  }
}
