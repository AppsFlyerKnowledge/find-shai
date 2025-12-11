import { defineFunction } from "@aws-amplify/backend";

// Define createCode function
export const createCode = defineFunction({
  name: "create-Code",
  entry: "./create-code/handler.ts", // Points to createCode.ts handler
  environment: {
    NAME: "World",
  },
});

// Define checkForCode function
export const checkForCode = defineFunction({
  name: "check-For-Code",
  entry: "./check-for-code/handler.ts", // Points to checkForCode.ts handler
  environment: {
    NAME: "World",
  },
});
