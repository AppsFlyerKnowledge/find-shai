
import { LocationClient, SearchPlaceIndexForTextCommand } from "@aws-sdk/client-location";
import type { Handler } from 'aws-lambda';

const client = new LocationClient();
// Create in AWS Location Service > Place indexes
const PLACE_INDEX_NAME = "ENTER_YOUR_PLACE_INDEX_NAME_HERE";

export const handler: Handler = async (event, context) => {
    try {
        const searchText = event["arguments"]["search_text"];

        if (!searchText || searchText.trim() === "") {
            return {
                error: "Search text is required",
                results: [],
                count: 0
            };
        }

        console.log("Geocoding search text:", searchText);

        const command = new SearchPlaceIndexForTextCommand({
            IndexName: PLACE_INDEX_NAME,
            Text: searchText,
            MaxResults: 5,
        });

        const response = await client.send(command);
        console.log("AWS Location Service response:", JSON.stringify(response, null, 2));

        if (response.Results && response.Results.length > 0) {
            const results = response.Results.map((result) => {
                const place = result.Place;
                return {
                    lat: place?.Geometry?.Point?.[1] || 0,
                    lon: place?.Geometry?.Point?.[0] || 0,
                    display_name: place?.Label || "",
                    address: {
                        country: place?.Country || "",
                        city: place?.Municipality || "",
                        street: place?.Street || "",
                    }
                };
            });

            console.log("Transformed results:", results);

            return {
                results: results,
                count: results.length
            };
        } else {
            console.log("No results found");
            return {
                results: [],
                count: 0
            };
        }
    } catch (error) {
        console.error("Error geocoding:", error);
        return {
            error: "Failed to geocode location",
            details: error instanceof Error ? error.message : String(error),
            results: [],
            count: 0
        };
    }
}

