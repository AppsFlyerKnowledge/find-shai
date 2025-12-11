import * as Location from 'expo-location';

export interface CurrentAddress {
  fullString: string;
  city: string;
  street: string;
}

/**
 * Converts coordinates to a human-readable address using reverse geocoding.
 * Uses expo-location's reverseGeocodeAsync (CLGeocoder on iOS) as primary method,
 * falls back to Nominatim API with Hebrew locale if needed.
 * 
 * Similar to iOS implementation:
 * - Street → from placemark.name / street
 * - City → from placemark.locality / city
 * - FullString → combined "Street, City"
 */
export async function getAddressFromLocation(
  latitude: number,
  longitude: number
): Promise<CurrentAddress> {
  try {
    // First, try using expo-location's native geocoder (CLGeocoder on iOS)
    const results = await Location.reverseGeocodeAsync(
      { latitude, longitude },
      { useGoogleMaps: false } // Use native geocoder (CLGeocoder on iOS)
    );

    if (results && results.length > 0) {
      const placemark = results[0];
      
      // Extract address components similar to iOS CLGeocoder
      const street = placemark.street || placemark.name || '';
      const city = placemark.city || placemark.subregion || placemark.region || '';
      
      // Build full address string
      const parts: string[] = [];
      if (street) parts.push(street);
      if (city) parts.push(city);
      
      const fullString = parts.join(', ') || 'Location unavailable';
      
      return {
        fullString,
        city,
        street,
      };
    }
  } catch (error) {
    console.log('Native geocoder failed, falling back to Nominatim:', error);
  }

  // Fallback: Use Nominatim API with Hebrew locale
  return getAddressFromNominatim(latitude, longitude);
}

/**
 * Fetches address from Nominatim API with Hebrew locale (he_IL)
 */
async function getAddressFromNominatim(
  latitude: number,
  longitude: number
): Promise<CurrentAddress> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=he`,
      {
        headers: {
          'User-Agent': 'FindShaiApp/1.0',
          'Accept': 'application/json',
          'Accept-Language': 'he',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch address. Status: ${response.status}`);
    }

    const data = await response.json();
    const { address, display_name } = data;

    if (!address && !display_name) {
      return getDefaultAddress();
    }

    // Extract address components
    const street = address?.road || address?.name || '';
    const houseNumber = address?.house_number || '';
    const city = address?.city || address?.town || address?.village || address?.suburb || '';
    const neighbourhood = address?.neighbourhood || '';

    // Build street with house number
    let streetWithNumber = street;
    if (street && houseNumber) {
      streetWithNumber = `${street} ${houseNumber}`;
    }

    // Build full address string
    const parts: string[] = [];
    if (streetWithNumber) {
      parts.push(streetWithNumber);
    } else if (neighbourhood) {
      parts.push(neighbourhood);
    }
    if (city) {
      parts.push(city);
    }

    const fullString = parts.join(', ') || display_name || 'Location unavailable';

    return {
      fullString,
      city,
      street: streetWithNumber || neighbourhood,
    };
  } catch (error) {
    console.error('Error fetching address from Nominatim:', error);
    return getDefaultAddress();
  }
}

function getDefaultAddress(): CurrentAddress {
  return {
    fullString: 'Location unavailable',
    city: '',
    street: '',
  };
}

/**
 * Simple function that returns just the address string
 * For backward compatibility with existing code
 */
export async function fetchAddressFromCoordinates(
  latitude: number,
  longitude: number
): Promise<string> {
  const address = await getAddressFromLocation(latitude, longitude);
  return address.fullString;
}

