import { generateClient } from "aws-amplify/api";
import type { Schema } from "../../data/resource";

const client = generateClient<Schema>({ authMode: "iam" });

// Push notification to the user's application using Expo Push Notifications
export async function pushNotificationToApp(
  care_giver_id: string,
  message_text: string,
  title: string = "Find Shai",
  data?: any
): Promise<void> {
  console.log(
    `Pushing notification to caregiver ${care_giver_id}: ${message_text}`
  );

  try {
    // Fetch caregiver's push token
    const caregiverResult = await client.models.Caregiver.get({
      id: care_giver_id,
    });

    if (!caregiverResult || !caregiverResult.data) {
      console.error(`Caregiver ${care_giver_id} not found`);
      return;
    }

    const pushToken = caregiverResult.data.push_token;

    if (!pushToken) {
      console.warn(`Caregiver ${care_giver_id} does not have a push token registered`);
      return;
    }

    // Send notification via Expo Push Notification Service
    const message = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: message_text,
      data: data || {},
      priority: 'high',
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Expo push notification response:', result);

    if (result.data && result.data.status === 'error') {
      console.error('Error sending push notification:', result.data.message);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
