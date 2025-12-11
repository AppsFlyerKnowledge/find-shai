import type { Handler } from "aws-lambda";
import type { Schema } from "../../../data/resource";
import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";
import outputs from "../../../../amplify_outputs.json";

const appsync_client = generateClient<Schema>({
  authMode: "iam",
});

Amplify.configure(outputs);

export const handler: Handler = async (event) => {
  console.log(event);
  try {
    // loved one id
    let user_id = event["user_id"];
    if (!user_id || user_id == "") {
      user_id = event["arguments"]["user_id"];
    }

    const pairingCode = generateCode(6); // Generates a 6-digit code

    const ttl = Math.floor(Date.now() / 1000) + 300; // Current time in seconds + 300 seconds

    // Create a WatchPairing entry
    await appsync_client.models.WatchPairing.create({
      code: pairingCode,
      loved_one_id: user_id,
      ttl: ttl,
    });

    return {
      success: true,
      code: pairingCode,
    };
  } catch (error: any) {
    console.error("Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

const generateCode = (codeLength: number): string => {
  let result = "";
  for (let i = 0; i < codeLength; i++) {
    const randomDigit = Math.floor(Math.random() * 10); // Generates a random number between 0-9
    result += randomDigit;
  }
  return result;
};
