import { LocationClient, GetDevicePositionCommand, GetDevicePositionCommandInput } from "@aws-sdk/client-location";
import type { Handler } from 'aws-lambda';
import type { Position } from "../../data/resource"

const client = new LocationClient(); // AWS Location Service client

export const handler: Handler = async (event, context) => {
    try {

        // HARD CODED
        const input: GetDevicePositionCommandInput = {
            TrackerName: "ENTER_YOUR_TRACKER_NAME_HERE",
            DeviceId: "ENTER_YOUR_DEVICE_ID_HERE"
        };

        const command = new GetDevicePositionCommand(input);

        const response = await client.send(command)

        if (response.Position) {

            const [longitude, latitude] = response.Position;
            var sampleTime = null;
            if (response.SampleTime){
                sampleTime = response.SampleTime.toISOString()
            }

            var batteryResult = 0;
            if (response.PositionProperties && response.PositionProperties['battery']) {
                try{
                    batteryResult = parseFloat(response.PositionProperties['battery'])}
                catch (error) {
                    console.error("Error retrieving battery level:", error)
                }
            }

            // Address is now fetched client-side using native geocoder (CLGeocoder on iOS)
            // with Hebrew locale for better localization
            const Position: Position = {
                longitude: longitude,
                latitude: latitude,
                battery: batteryResult,
                sample_time: sampleTime,
            }
            return Position;

        } else {

            return ("No position found for this device.");
        }
    } catch (error) {
        return { "Error retrieving device position:": error }
    }
}