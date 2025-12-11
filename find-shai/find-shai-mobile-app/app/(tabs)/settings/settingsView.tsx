
import React, { useState } from 'react';
import { signOut } from 'aws-amplify/auth';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { createLovedOne } from '@/api/data';

// ============================================
// FEATURE FLAGS - Set to true for creating loved one for testing
// ============================================
const SHOW_DEV_FEATURES = false;
// ============================================

const SettingsScreen = () => {
  const [isCreating, setIsCreating] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress:()=>{signOut()} },
    ]);
  };

  const handleCreateLovedOne = async () => {
    setIsCreating(true);
    try {
      const success = await createLovedOne('Shai', 'shai@example.com', 'none');
      if (success) {
        Alert.alert('Success', 'Loved One created! Please restart the app to see the changes.');
      } else {
        Alert.alert('Error', 'Failed to create Loved One');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create Loved One');
    }
    setIsCreating(false);
  };

  return (
    <View style={styles.container} >
      <SafeAreaView/>
      
      {/* DEV/TESTING FEATURES - Only shown when SHOW_DEV_FEATURES is true */}
      {SHOW_DEV_FEATURES && (
        <TouchableOpacity 
          onPress={handleCreateLovedOne} 
          style={styles.createButton}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Loved One (Testing)</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  createButton: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#34C759',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 18,
    color: '#fff',
  },
});

export default SettingsScreen;
