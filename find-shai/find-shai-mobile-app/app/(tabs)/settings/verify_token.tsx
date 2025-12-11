// import { StyleSheet, Text, View } from 'react-native';

// export default function VerifyToken() {
//   return (
//     <View style={styles.container}>
//       <Text>VerifyToken</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import { router } from 'expo-router'; // No need for useNavigation
// import { Keyboard } from 'react-native';

const VerifyTokenPage = () => {
  const [token, setToken] = useState(['', '', '', '', '', '']);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Navigate to the Settings page
  // const handleNavigateBack = () => {
  //   router.replace('/settings');
  //   Keyboard.dismiss(); // Dismiss the keyboard
  // };

  const handleChange = (text: string, index: number) => {
    const newToken = [...token];

    if (text) {
      newToken[index] = text;
      if (index < 5) {
        inputRefs.current[index + 1]?.focus(); // Focus the next input
      }
    } else {
      newToken[index] = ''; // Clear the current input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus(); // Focus the previous input if deleting
      }
    }

    setToken(newToken);
  };

  const verifyToken = async () => {
    const tokenString = token.join('');
    if (tokenString.length < 6) {
      alert('Please enter a complete token.');
      return;
    }

    try {
      const response = await fetch('YOUR_API_ENDPOINT', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenString }),
      });

      const data = await response.json();
      setIsVerified(data.isValid);
      // Optionally reset token state after verification
      if (data.isValid) {
        setToken(['', '', '', '', '', '']); // Clear input fields if verified
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      setIsVerified(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* <TouchableOpacity style={styles.iconContainer} onPress={handleNavigateBack}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity> */}
      
      <Text style={styles.title}>Verify Token</Text>
      
      <View style={styles.inputContainer}>
        {token.map((digit, index) => (
          <TextInput
            key={index}
            style={styles.input}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            keyboardType="numeric"
            maxLength={1}
            ref={(ref) => (inputRefs.current[index] = ref)} // Assign ref
          />
        ))}
        {/* Add Key Icon at the end */}
        <Ionicons name="key-outline" size={40} color="gray" style={styles.keyIcon} />
      </View>
      
      <Button title="Verify" onPress={verifyToken} color="gray" />
      
      {isVerified !== null && (
        <Text style={[styles.result, isVerified ? styles.success : styles.error]}>
          {isVerified ? 'Token Verified Successfully!' : 'Invalid Token!'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  iconContainer: {
    position: 'absolute',
    top: 20, // Position from top
    left: 20, // Position from left
    padding: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Align input and key icon in the center
    width: '80%',
    marginBottom: 20,
  },
  input: {
    height: 50,
    width: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 24,
    backgroundColor: '#fff',
  },
  keyIcon: {
    marginLeft: 10,
  },
  result: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
});

export default VerifyTokenPage;
