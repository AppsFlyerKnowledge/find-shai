import React, { useState, useRef } from "react";
import {
  Alert,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import MapView, {
  MapPressEvent,
  Marker,
  Polygon,
  LatLng,
} from "react-native-maps";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import axios from "axios";
import { router } from "expo-router";
import { addCustomLocation, setHome, getClient, resetClient } from "../../../api/data";
import { useStateContext } from "@/state/state";
import { useLocalSearchParams } from "expo-router";
import { SafeZone } from "../../../../amplify/data/resource";

// HARDCODED loved one - all caregivers see this one
const HARDCODED_LOVED_ONE_ID = "ENTER_YOUR_LOVED_ONE_ID_HERE";

export default function SafeZoneCreationPage() {
  const [polygons, setPolygons] = useState<LatLng[]>([]); // Array of LatLng points for the polygon
  const [safeZoneName, setSafeZoneName] = useState<string>(""); // Safe zone name
  const [searchLocation, setSearchLocation] = useState<string>(""); // Location search input
  const [searchedLatLng, setSearchedLatLng] = useState<LatLng | null>(null); // Hold searched location's coordinates
  const { state, dispatch } = useStateContext();
  const params = useLocalSearchParams();
  const { type } = params;

  const mapRef = useRef<MapView | null>(null); // Reference for the map
  const [isDrawing, setIsDrawing] = useState<boolean>(false); // Track if we are in drawing mode

  // Start Drawing the Polygon
  const startDrawingPolygon = () => {
    if (safeZoneName.trim() === "" && type !== "add_home") {
      Alert.alert("Error", "Please provide a name for the safe zone.");
      return;
    }
    setIsDrawing(true);
  };

  // Stop Drawing the Polygon
  const stopDrawingPolygon = () => {
    setIsDrawing(false);
  };

  // Save the Safe Zone
  const saveSafeZone = () => {
    if (polygons.length < 3) {
      Alert.alert("Error", "A safe zone requires at least 3 points.");
      return;
    }
    Alert.alert("Success", "Safe zone created successfully!");

    if (state.lovedOne && state.lovedOne?.id) {
      const current_known_location: SafeZone[] = state.lovedOne.known_locations
        ? state.lovedOne.known_locations.filter(
            (location) => location !== null && location !== undefined
          )
        : [];
      // addCustomLocation(state.lovedOne.id, safeZoneName, coordinatesArray, current_known_location);

      if (type === "add_home") {
        setHome(dispatch, HARDCODED_LOVED_ONE_ID, polygons).then(() => {
          // reload safe zones ...
          router.back();
        });
      } else {
        addCustomLocation(
          dispatch,
          HARDCODED_LOVED_ONE_ID,
          safeZoneName,
          polygons,
          current_known_location
        ).then(() => {
          // reload safe zones ...
          router.back();
        });
      }
    }

    setPolygons([]); // Clear polygon after saving
  };

  // Handle Map Press
  const clickOnMap = ({ nativeEvent: { coordinate } }: MapPressEvent) => {
    if (isDrawing) {
      setPolygons([...polygons, coordinate]); // Add a point to the polygon
    }
  };

  // Save the searched location as home with a default boundary
  const saveLocationWithDefaultBoundary = async (lat: number, lon: number, displayName: string) => {
    // Validate safe zone name for custom locations
    if (type !== "add_home" && safeZoneName.trim() === "") {
      Alert.alert("Error", "Please provide a name for the safe zone.");
      return;
    }

    // Create a default square boundary around the point (approximately 100m radius)
    // At this latitude, 0.0009 degrees is roughly 100 meters
    const offset = 0.0009;
    const defaultBoundary: LatLng[] = [
      { latitude: lat + offset, longitude: lon - offset }, // Top-left
      { latitude: lat + offset, longitude: lon + offset }, // Top-right
      { latitude: lat - offset, longitude: lon + offset }, // Bottom-right
      { latitude: lat - offset, longitude: lon - offset }, // Bottom-left
    ];

    try {
      if (type === "add_home") {
        await setHome(dispatch, HARDCODED_LOVED_ONE_ID, defaultBoundary, displayName);
        Alert.alert("Success", `Home set to: ${displayName}`);
      } else {
        const current_known_location: SafeZone[] = state.lovedOne?.known_locations
          ? state.lovedOne.known_locations.filter(
              (location) => location !== null && location !== undefined
            )
          : [];
        
        // Combine custom name with the full address
        const locationNameWithAddress = `${safeZoneName} - ${displayName}`;
        
        await addCustomLocation(
          dispatch,
          HARDCODED_LOVED_ONE_ID,
          locationNameWithAddress,
          defaultBoundary,
          current_known_location
        );
        Alert.alert("Success", `Safe zone "${safeZoneName}" added at: ${displayName}`);
      }
      router.back();
    } catch (error) {
      console.error("Error saving location:", error);
      Alert.alert("Error", "Failed to save location. Please try again.");
    }
  };

  // Handle Searching for a Location using AWS Location Service
  const searchLocationHandler = async () => {
    if (searchLocation.trim() === "") {
      Alert.alert("Error", "Please enter a location.");
      return;
    }

    console.log("Searching for location:", searchLocation);
    
    try {
      let client = getClient();
      
      // Check if Geocode query exists, if not reset client and try again
      if (!client.queries || !client.queries.Geocode) {
        console.log("Geocode query not found, resetting client...");
        resetClient();
        client = getClient();
      }
      
      // Call our backend geocoding function
      const { data, errors } = await client.queries.Geocode({
        search_text: searchLocation
      });

      console.log("Geocoding response:", data);
      
      if (errors) {
        console.error("Geocoding errors:", errors);
        throw new Error("Geocoding failed");
      }

      // Parse the JSON response (Amplify returns AWSJSON as a string)
      let geocodeData;
      if (typeof data === 'string') {
        geocodeData = JSON.parse(data);
      } else {
        geocodeData = data;
      }

      console.log("Parsed data:", geocodeData);
      
      if (geocodeData && geocodeData.results && geocodeData.results.length > 0) {
        const location = geocodeData.results[0];
        const lat = parseFloat(String(location.lat));
        const lon = parseFloat(String(location.lon));

        console.log("Found location:", { lat, lon, name: location.display_name });

        const searchedCoordinates: LatLng = { latitude: lat, longitude: lon };
        setSearchedLatLng(searchedCoordinates);

        mapRef.current?.animateToRegion({
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        
        // Auto-save the location with a default boundary
        const title = type === "add_home" ? "Set as Home?" : "Add Safe Zone?";
        const message = `Found: ${location.display_name}\n\nSave this location?`;
        const confirmText = type === "add_home" ? "Set as Home" : "Add Safe Zone";
        
        Alert.alert(
          title, 
          message,
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: confirmText,
              onPress: () => saveLocationWithDefaultBoundary(lat, lon, location.display_name)
            }
          ]
        );
      } else {
        console.log("No results found for:", searchLocation);
        Alert.alert("Error", "Location not found. Please try another search.");
      }
    } catch (error) {
      console.error("Location search error:", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error instanceof Error ? error.message : String(error));
      Alert.alert("Error", "Unable to find location. Please try again.");
    }
  };

  // Reset Functionality: Clear map, polygon, and searched location
  const resetMap = () => {
    setPolygons([]);
    setSearchedLatLng(null);
    setSearchLocation("");
    setSafeZoneName("");
  };

  const ControlPanel = () => {
    return (
      <View style={styles.containerButton}>
        {/* Start Button */}
        <TouchableOpacity style={styles.button} onPress={startDrawingPolygon}>
          <Icon
            name="pencil"
            size={24}
            color={isDrawing ? "#229954" : "#000"}
          />
        </TouchableOpacity>

        {/* Stop Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={stopDrawingPolygon}
          disabled={!isDrawing}
        >
          <Icon name="stop" size={24} color={isDrawing ? "#cb4335" : "#000"} />
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={saveSafeZone}
          disabled={polygons.length == 0}
        >
          <Icon
            name="content-save"
            size={24}
            color={polygons.length == 0 ? "#85929e" : "#000"}
          />
        </TouchableOpacity>

        {/* Reset Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={resetMap}
          disabled={polygons.length == 0}
        >
          <Icon
            name="restart"
            size={24}
            color={polygons.length == 0 ? "#85929e" : "#000"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {type === "add_home" ? null : (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Safe Zone Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Safe Zone Name"
            value={safeZoneName}
            onChangeText={setSafeZoneName}
          />
        </View>
      )}

      {/* Location Search Input */}
      <View style={styles.inputContainer}>
        {/* <Text style={styles.inputLabel}>Search Location</Text> */}
        <TextInput
          style={styles.input}
          placeholder="Enter location to search"
          value={searchLocation}
          onChangeText={setSearchLocation}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={searchLocationHandler}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Map and Marker */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.mapContainer}
          onPress={clickOnMap}
          initialRegion={{
            latitude: 32.0853, // Latitude for Tel Aviv
            longitude: 34.7818, // Longitude for Tel Aviv
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {/* Display the searched location marker if it exists */}
          {searchedLatLng && (
            <Marker coordinate={searchedLatLng} title="Searched Location" />
          )}

          {/* Draw the polygon if there are points */}
          {polygons.length > 0 && (
            <Polygon
              coordinates={polygons}
              strokeColor="#000"
              fillColor="rgba(100, 100, 200, 0.5)"
            />
          )}
        </MapView>
      </View>
      <ControlPanel></ControlPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 10,
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1,
  },
  title: {
    fontSize: 24,
    marginVertical: 10,
    textAlign: "center",
  },
  inputContainer: {
    width: "80%",
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: "100%",
  },
  searchButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  mapWrapper: {
    width: "100%",
    flex: 1,
  },
  mapContainer: {
    width: "100%",
    height: "100%",
  },
  actionsContainer: {
    position: "relative",
    marginBottom: 5,
    backgroundColor: "#fff",
  },
  containerButton: {
    flexDirection: "row", // This puts all the buttons inline
    justifyContent: "space-between", // This spreads the buttons evenly
    padding: 10,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 30, // This creates some space around the icon
    paddingRight: 30,
    padding: 10,
  },
});
