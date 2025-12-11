import { defineFunction } from '@aws-amplify/backend';

export const calendarSync = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'calendar-sync',
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts',
  environment: {
    NAME: "World",
  }
});