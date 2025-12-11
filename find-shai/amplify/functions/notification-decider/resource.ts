import { defineFunction } from "@aws-amplify/backend";

export const notificationDecider = defineFunction({
  name: "notification-decider",
  entry: "./handler.ts",
  environment: {
    NAME: "World",
  },
});
