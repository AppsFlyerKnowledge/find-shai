import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker, Circle, Polygon } from "react-native-maps"; // Import Circle from react-native-maps
import { SafeZone } from "../../../../amplify/data/resource";
import {useLocalSearchParams } from "expo-router";
import { useStateContext } from "@/state/state";

const SafeZoneModal = () => {
  const params = useLocalSearchParams();
  const { state } = useStateContext();
  const { section, safeZoneId } = params;

  const getSafeZoneById = () => {
    if (section === "Active") {
      return state.lovedOne?.safe_zones?.find(
        (safeZone) => safeZone?.id === safeZoneId
      );
    } else if (section === "Custom") {
      return state.lovedOne?.known_locations?.find(
        (safeZone) => safeZone?.id === safeZoneId
      );
    } else if (section === "Home") {
      return state.lovedOne?.home;
    }
  };

  const safeZone = getSafeZoneById() as SafeZone | undefined;

  const polygon = safeZone?.polygon
    ?.map((point) => {
      if (point?.latitude !== undefined && point?.longitude !== undefined) {
        return { latitude: point.latitude, longitude: point.longitude };
      }
      return null;
    })
    .filter((point) => point !== null) as {
    latitude: number;
    longitude: number;
  }[];

  const getInitialRegion = () => {
    if (safeZone?.is_custom_location || safeZone?.is_home) {
      return {
        latitude: polygon[0].latitude || 37.78825,
        longitude: polygon[0].longitude || 37.78825,
        latitudeDelta: 0.05,
        longitudeDelta: 0.01,
      };
    } else {
      return {
        latitude: safeZone?.circle?.center.latitude || 0,
        longitude: safeZone?.circle?.center.longitude || 0,
        latitudeDelta: 0.005, // Adjusted zoom level
        longitudeDelta: 0.005, // Adjusted zoom level
      };
    }
  };

  return (
    <View style={styles.container}>
      <Text>{safeZone?.location_name}</Text>
      <MapView style={styles.map} initialRegion={getInitialRegion()}>
        {!safeZone?.is_custom_location ? (
          <Marker
            coordinate={{
              latitude: safeZone?.circle?.center.latitude || 0,
              longitude: safeZone?.circle?.center.longitude || 0,
            }}
            title={safeZone?.location_name}
            // onPress={closeModal} // Optional: Close modal on marker press
          />
        ) : null}

        {!safeZone?.is_custom_location ? (
          <Circle
            center={{
              latitude: safeZone?.circle?.center.latitude || 0,
              longitude: safeZone?.circle?.center.longitude || 0,
            }}
            radius={100} // Circle radius in meters
            strokeColor="black" // Circle stroke color
            fillColor="rgba(0, 0, 0, 0.2)" // Circle fill color (optional)
            strokeWidth={3} // Circle stroke width (thicker)
          />
        ) : null}
        {safeZone?.is_custom_location ? (
          <Polygon
            coordinates={polygon}
            strokeColor="red" // Polygon stroke color
            fillColor="rgba(0, 0, 255, 0.2)" // Polygon fill color (optional)
            strokeWidth={2} // Polygon stroke width
          />
        ) : null}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 16,
  },
  itemContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  itemText: {
    fontSize: 18,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noDataText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Darker background for better contrast
  },
  modalContent: {
    width: "90%",
    height: "70%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5, // For Android shadow
    alignItems: "center",
    justifyContent: "flex-start", // Align items to the start to remove empty space
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    marginBottom: 10, // Adjust margin to fit the layout
  },
  closeButtonText: {
    fontSize: 16,
    color: "#007BFF",
  },
  modalText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },
  map: {
    width: "100%",
    height: "60%", // Adjust the height to fit the modal
    borderRadius: 10,
  },
  AddButtonText: {
    color: "#007BFF",
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  RemoveButtonText: {
    color: "#FF3B30",
    fontSize: 16,
  },
  Button: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
});

export default SafeZoneModal;
