import { defineAuth, secret } from "@aws-amplify/backend";
import { postConfirmation } from "./post-confirmation/resource";

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: "Welcome to Find Shai! Verify your email!",
    },
  },
  userAttributes: {
    givenName: {
      mutable: true,
      required: true,
    },
    "custom:is_loved_one": {
      dataType: "Boolean",
      mutable: true,
    },
  },
  triggers: {
    postConfirmation,
  },
});
