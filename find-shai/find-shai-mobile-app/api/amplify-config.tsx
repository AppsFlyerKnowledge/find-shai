import { Amplify } from "aws-amplify";
import outputs from "../app/amplify_outputs.json";

let isAmplifyConfigured = false;

export const ensureAmplifyConfigured = () => {
  if (!isAmplifyConfigured) {
    console.log("Configuring Amplify...");
    console.log("Available queries in outputs:", outputs.data?.model_introspection?.queries ? Object.keys(outputs.data.model_introspection.queries) : "No queries found");
    Amplify.configure(outputs);
    isAmplifyConfigured = true;
  }
};

// Call it immediately to configure on module load
ensureAmplifyConfigured();

