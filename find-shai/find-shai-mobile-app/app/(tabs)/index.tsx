import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import MapView, { Marker, Circle, MapPressEvent, Region } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useStateContext } from '@/state/state';
import { fetchAddressFromCoordinates } from '@/services/geocoding';

// Define a type for the route parameters
type RootStackParamList = {
  Home: { coordinates: { latitude: number; longitude: number } };
};

type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

const Home = () => {
  const route = useRoute<HomeScreenRouteProp>();
  const mapRef = useRef<MapView | null>(null);
  const { state } = useStateContext();

  const [locationDetails, setLocationDetails] = useState({
    address: 'N/A',
    lastUpdate: 'N/A',
    battery: 'N/A',
  });

  const [markerCoordinate, setMarkerCoordinate] = useState({ 
    latitude: state.position?.latitude || 32.0853, 
    longitude: state.position?.longitude || 34.7818 
  });

  const [circleCoordinates, setCircleCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  // Update marker when position changes from state
  useEffect(() => {
    if (state.position?.latitude && state.position?.longitude) {
      const newCoordinate = {
        latitude: state.position.latitude,
        longitude: state.position.longitude
      };
      setMarkerCoordinate(newCoordinate);
      
      // Fetch address using client-side reverse geocoding (Hebrew locale)
      // Similar to iOS CLGeocoder.reverseGeocodeLocation with he_IL locale
      setLocationDetails((prev) => ({
        ...prev,
        address: 'Loading address...',
      }));
      
      fetchAddressFromCoordinates(state.position.latitude, state.position.longitude)
        .then((address) => {
          setLocationDetails((prev) => ({
            ...prev,
            address: address,
          }));
        })
        .catch(() => {
          setLocationDetails((prev) => ({
            ...prev,
            address: 'Location unavailable',
          }));
        });
      
      // Animate map to new position
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: state.position.latitude,
          longitude: state.position.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    }
  }, [state.position]);

  // No need for initial address fetching - it comes from backend
  useEffect(() => {
  }, []);

  useEffect(() => {
    if (route.params?.coordinates) {
      setMarkerCoordinate(route.params.coordinates);
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: route.params.coordinates.latitude,
          longitude: route.params.coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
      setCircleCoordinates(route.params.coordinates);
    }
  }, [route.params]);

  const handleRegionChange = (region: Region) => {
    setLocationDetails((prev) => ({
      ...prev,
      lastUpdate: new Date().toLocaleTimeString(),
    }));
  };

  const handleMapPress = async (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerCoordinate({ latitude, longitude });
    
    // Show loading state while fetching address
    setLocationDetails((prev) => ({
      ...prev,
      address: 'Loading address...',
      lastUpdate: new Date().toLocaleTimeString(),
    }));

    // Fetch address using reverse geocoding (Hebrew locale)
    const address = await fetchAddressFromCoordinates(latitude, longitude);
    setLocationDetails((prev) => ({
      ...prev,
      address: address || `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    }));

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const openMaps = () => {
    const locationName = encodeURIComponent(locationDetails.address);
    Alert.alert(
      "Choose Navigation App",
      "Select your preferred navigation app:",
      [
        {
          text: "Google Maps",
          onPress: () => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${locationName}`).catch(() => Alert.alert('Error', 'Failed to open Google Maps')),
        },
        {
          text: "Waze",
          onPress: () => Linking.openURL(`https://waze.com/ul?q=${locationName}`).catch(() => Alert.alert('Error', 'Failed to open Waze')),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  function getBattery() {
    // Battery is already 0-1, watch sends it as a decimal (e.g., 0.85 for 85%)
    const batteryValue = state.position && state.position.battery ? `${(state.position.battery * 100).toFixed(0)}%` : "N/A";
    // console.log('getBattery called, value:', batteryValue, 'raw battery:', state.position?.battery);
    return batteryValue;
  }

  function getLastUpdateTime() {
    if (state.position && state.position.sample_time) {
      const originalDate = new Date(state.position.sample_time);
      const pad = (num: number) => (num < 10 ? '0' + num : num);
      const formatted = `${originalDate.getFullYear()}/${pad(originalDate.getMonth() + 1)}/${pad(originalDate.getDate())} ${pad(originalDate.getHours())}:${pad(originalDate.getMinutes())}`;
      // console.log('getLastUpdateTime called, value:', formatted);
      return formatted;
    }
    console.log('getLastUpdateTime called, no sample_time');
    return "N/A";
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: markerCoordinate.latitude,
          longitude: markerCoordinate.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onRegionChangeComplete={handleRegionChange}
        onPress={handleMapPress}
      >
        <Marker coordinate={markerCoordinate} pinColor="red" />
        
        {circleCoordinates && (
          <Circle
            center={circleCoordinates}
            radius={100}
            strokeColor="#4F6D7A"
            strokeWidth={2}
            fillColor="transparent"
          />
        )}
      </MapView>

      <View style={styles.infoContainer}>
        <InfoBox 
          icon="location-outline" 
          title="Location" 
          value={locationDetails.address} 
          onPress={openMaps} 
        />
        <InfoBox 
          icon="time-outline" 
          title="Last Update" 
          value={getLastUpdateTime()}
        />
        <InfoBox 
          icon="battery-half-outline" 
          title="Battery" 
          value={getBattery()} 
        />
      </View>
    </View>
  );
};

type InfoBoxProps = {
  icon: string;
  title: string;
  value: string;
  onPress?: () => void; 
};

const InfoBox: React.FC<InfoBoxProps> = ({ icon, title, value, onPress }) => (
  <View style={styles.infoBox} onTouchEnd={onPress}>
    <Icon name={icon} size={40} color="green" />
    <View style={styles.infoTextContainer}>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flexDirection: 'column',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 15,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 20,
    width: '85%',
  },
  infoTextContainer: {
    marginLeft: 10,
  },
  infoTitle: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 16,
    color: '#555',
  },
});

export default Home;
