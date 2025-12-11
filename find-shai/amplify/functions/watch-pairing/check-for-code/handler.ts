import type { Handler } from "aws-lambda";
import type { Schema, WatchPairing } from "../../../data/resource";
import { generateClient } from "aws-amplify/api";
import { Amplify } from "aws-amplify";
import outputs from "../../../../amplify_outputs.json";

const appsync_client = generateClient<Schema>({
  authMode: "iam",
});

Amplify.configure(outputs);

// for care giver
export const handler: Handler = async (event) => {
  console.log(event);
  try {
    // id of care giver
    let user_id = event["user_id"];
    if (!user_id || user_id == "") {
      user_id = event["arguments"]["user_id"];
    }

    const { code } = event.arguments;

    // Check if the code exists in the database
    const pairing = await checkCodeExists(code);

    if (pairing) {
      // If the code exists, link the loved one's ID to the caregiver (user_id)
      await linkLovedOneWithCaregiver(pairing.loved_one_id, user_id);

      // Delete the code using pairing.id
      const isDeleted = await deleteCode(pairing.id);
      if (!isDeleted) {
        console.warn(`Warning: Entry with ID ${pairing.id} was not deleted.`);
      } else {
        console.log("code ", pairing.code, "deleted succesfully");
      }

      return {
        success: true,
        message: "Code verified and linked successfully.",
      };
    } else {
      return {
        success: false,
        message: "Code not found.",
      };
    }
  } catch (error: any) {
    console.error("Error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Function to check if the code exists in the database
async function checkCodeExists(code: string): Promise<WatchPairing | null> {
  return new Promise((resolve, reject) => {
    console.log("cheking in the DB for code", code);
    const subscription = appsync_client.models.WatchPairing.observeQuery({
      filter: { code: { eq: code } },
    }).subscribe({
      next: (result) => {
        console.log("result before check:", result);
        if (result.items && result.items.length > 0) {
          // If code exists, resolve with the first matching item
          resolve(result.items[0]);
        } else {
          // If code does not exist
          console.log("code not found");
          resolve(null);
        }
      },
      error: (error) => {
        console.error("Error fetching code:", error);
        reject(error);
      },
    });

    // Clean up the subscription when it's no longer needed
    return () => {
      subscription.unsubscribe();
    };
  });
}

// Placeholder function to link the loved one with the caregiver
async function linkLovedOneWithCaregiver(
  loved_one_id: string,
  caregiver_id: string
) {
  const result = await appsync_client.models.Caregiver.update({
    id: caregiver_id,
    loved_one_id: loved_one_id,
  });
}

// Function to delete the pairing entry using its id
async function deleteCode(id: string): Promise<boolean> {
  try {
    // Delete the item directly by id
    await appsync_client.models.WatchPairing.delete({ id });
    console.log(`Entry with ID ${id} deleted successfully.`);
    return true;
  } catch (error) {
    console.error("Error deleting code:", error);
    return false;
  }
}
