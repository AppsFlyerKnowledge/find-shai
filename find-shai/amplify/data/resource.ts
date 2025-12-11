import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { postConfirmation } from "../auth/post-confirmation/resource";
import { calendarSync } from "../functions/calendar-sync/resource";
import { locationFetcher } from "../functions/location-fetcher/resource";
import { geocoding } from "../functions/geocoding/resource";

const schema = a
  .schema({
    SafeZone: a.customType({
      id: a.string().required(),
      polygon: a.ref("Location").array(), // custom safe zone
      circle: a.ref("Circle"), // auto generated safe zone
      location_name: a.string().required(),
      is_custom_location: a.boolean().required(),
      is_home: a.boolean().required(),
      calender_events: a.string().array().required(),
    }),
    Location: a.customType({
      latitude: a.float().required(),
      longitude: a.float().required(),
    }),
    Circle: a.customType({
      radius: a.integer().required(), // in meters
      center: a.ref("Location").required(), // Reference to Location as center
    }),
    Position: a.customType({
      latitude: a.float().required(),
      longitude: a.float().required(),
      sample_time: a.datetime(),
      battery: a.float().required(),
    }),
    WatchPairing: a.model({
      code: a.string().required(),
      loved_one_id: a.string().required(),
      ttl: a.integer().required(),
    }),
    CalendarEvent: a.customType({
      id: a.string().required(),
      event_name: a.string().required(),
      start_time: a.datetime().required(),
      end_time: a.datetime().required(),
      custom_buffer_time: a.integer().required(),
      mute_this_event: a.boolean().required(),
      location_name: a.string().required(),
      is_from_google_calendar: a.boolean().required(),
      safe_zone_id: a.string(),
    }),
    QuiteHour: a.customType({
      start_time: a.datetime().required(),
      end_time: a.datetime().required(),
    }),
    Caregiver: a.model({
      id: a.string().required(),
      name: a.string().required(),
      email: a.email().required(),
      should_send_messages: a.boolean().default(true).required(),
      send_just_if_not_exepected: a.boolean().default(false).required(),
      location_update_frequent: a.integer().default(15).required(),
      time_buffer: a.integer().default(0).required(),
      quite_hours: a.ref("QuiteHour").array(),
      loved_one_id: a.string(),
      push_token: a.string(), // Expo push notification token
      loved_one: a.belongsTo("LovedOne", "loved_one_id"), // a caregiver can only have 1 loved one
      notifications: a.hasMany("Notification", "caregiver_id"), // a list of caregivers
    }),
    LovedOne: a
      .model({
        name: a.string().required(),
        email: a.email().required(),
        calander_token: a.string().required(),
        calander_events: a.ref("CalendarEvent").array().required(),
        safe_zones: a.ref("SafeZone").array().required(),
        known_locations: a.ref("SafeZone").array().required(),
        home: a.ref("SafeZone"),
        default_radius: a.integer().default(500).required(),
        tracker_arn: a.string().required(),
        geofence_collection_arn: a.string().required(),
        caregivers: a.hasMany("Caregiver", "loved_one_id"), // a list of caregivers
      })
      .authorization((allow) => [allow.guest(), allow.authenticated()]),

    Notification: a.model({
      caregiver: a.belongsTo("Caregiver", "caregiver_id"),
      caregiver_id: a.id().required(),
      is_as_expected: a.boolean().required(),
      message: a.string().required(),
      event_type: a.string().required(), // ENTER or EXIT
      ttl: a.float().required(),
      geofence_id: a.string().required(),
      location_name: a.string().required(),
      longitude: a.float().required(),
      latitude: a.float().required(),
      calander_event: a.ref("CalendarEvent"),
      safe_zone: a.ref("SafeZone"),
    }),
    CreateUserFunction: a // trigger create user for testing
      .query()
      .arguments({ user_data: a.string() })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(postConfirmation)),
    CalendarSyncFunction: a // trigger calendar sync function
      .query()
      .arguments({ user_id: a.string() })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(calendarSync)),
    FetchLocation: a // fetch user location from tracker
      .query()
      .arguments({ user_id: a.string() })
      .returns(a.ref("Position"))
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(locationFetcher)),
    Geocode: a // geocode location search text
      .query()
      .arguments({ search_text: a.string() })
      .returns(a.json())
      .authorization((allow) => [allow.authenticated()])
      .handler(a.handler.function(geocoding)),
  })
  .authorization((allow) => [allow.guest(), allow.authenticated()]);

export type Schema = ClientSchema<typeof schema>;

export type Circle = Schema["Circle"]["type"];
export type Location = Schema["Location"]["type"];
export type SafeZone = Schema["SafeZone"]["type"];
export type CalendarEvent = Schema["CalendarEvent"]["type"];
export type Caregiver = Schema["Caregiver"]["type"];
export type LovedOne = Schema["LovedOne"]["type"];
export type Notification = Schema["Notification"]["type"];
export type Position = Schema["Position"]["type"];
export type WatchPairing = Schema["WatchPairing"]["type"];
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "iam",
  },
});
