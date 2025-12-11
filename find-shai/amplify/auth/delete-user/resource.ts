import { defineFunction } from "@aws-amplify/backend";

export const deleteUser = defineFunction({
  name: "delete-user",
  entry: "./handler.ts",
  environment: {
    NAME: "World",
  },
});
