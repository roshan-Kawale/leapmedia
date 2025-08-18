import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PermissionUtils from '../utils/PermissionUtils';

const PermissionScreen = ({ navigation }) => {
  const [permissionStatus, setPermissionStatus] = useState({});
  const [versionInfo, setVersionInfo] = useState({});
  const [allPermissionsGranted, setAllPermissionsGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const checkPermissions = async () => {
    try {
      const isAndroid11Plus = Platform.OS === 'android' && Platform.Version >= 30;
      
      // For Android 11+, we need different approach for storage
      let permissionsToCheck = [
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
      ];
      
      // For Android < 11, include traditional storage permissions
      if (!isAndroid11Plus) {
        permissionsToCheck.push(
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
          PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE
        );
      }

      // Check standard permissions
      const results = await Promise.all(
        permissionsToCheck.map(permission => check(permission))
      );

      // Check MANAGE_EXTERNAL_STORAGE for Android 11+
      let manageStorageResult = RESULTS.GRANTED;
      if (isAndroid11Plus) {
        try {
          manageStorageResult = await check(manageStoragePermission);
        } catch (error) {
          console.log('MANAGE_EXTERNAL_STORAGE not available:', error);
          manageStorageResult = RESULTS.GRANTED; // Continue without it for now
        }
      }

      let newStatus;
      if (isAndroid11Plus) {
        // Android 11+: Use MANAGE_EXTERNAL_STORAGE instead of READ/WRITE
        newStatus = {
          camera: results[0] === RESULTS.GRANTED,
          readStorage: manageStorageResult === RESULTS.GRANTED, // Use manage storage for both
          writeStorage: manageStorageResult === RESULTS.GRANTED, // Use manage storage for both
          manageStorage: manageStorageResult === RESULTS.GRANTED,
          fineLocation: results[1] === RESULTS.GRANTED,
          coarseLocation: results[2] === RESULTS.GRANTED,
        };
      } else {
        // Android < 11: Use traditional storage permissions
        newStatus = {
          camera: results[0] === RESULTS.GRANTED,
          readStorage: results[3] === RESULTS.GRANTED,
          writeStorage: results[4] === RESULTS.GRANTED,
          manageStorage: true, // Not needed on older Android
          fineLocation: results[1] === RESULTS.GRANTED,
          coarseLocation: results[2] === RESULTS.GRANTED,
        };
      }

      setPermissionStatus(newStatus);

      // For Android 11+, we'll be more lenient with storage permissions
      const requiredForContinue = isAndroid11Plus 
        ? newStatus.camera && newStatus.fineLocation && newStatus.coarseLocation
        : Object.values(newStatus).every(status => status === true);
      
      setAllPermissionsGranted(requiredForContinue);

      if (requiredForContinue) {
        navigation.replace('VideoList');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const isAndroid11Plus = Platform.OS === 'android' && Platform.Version >= 30;
      
      // Request basic permissions that are always needed
      let permissionsToRequest = [
        PERMISSIONS.ANDROID.CAMERA,
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
      ];
      
      // For Android < 11, include traditional storage permissions
      if (!isAndroid11Plus) {
        permissionsToRequest.push(
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
          PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE
        );
      }

      // Request standard permissions
      const results = await requestMultiple(permissionsToRequest);

      // For Android 11+, show special handling for storage permissions
      let manageStorageResult = RESULTS.GRANTED;
      if (isAndroid11Plus) {
        try {
          // Try to request MANAGE_EXTERNAL_STORAGE
          manageStorageResult = await request(manageStoragePermission);
        } catch (error) {
          console.log('MANAGE_EXTERNAL_STORAGE request failed:', error);
          // If it fails, show dialog to open settings
          Alert.alert(
            'Storage Permission Needed',
            'For Android 11+, storage access requires manual permission. Would you like to open Settings?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => {
                  openSettings().catch(() => {
                    Alert.alert('Error', 'Could not open settings');
                  });
                }
              },
            ]
          );
          manageStorageResult = RESULTS.DENIED;
        }
      }

      let newStatus;
      if (isAndroid11Plus) {
        // Android 11+: Use different status logic
        newStatus = {
          camera: results[PERMISSIONS.ANDROID.CAMERA] === RESULTS.GRANTED,
          readStorage: manageStorageResult === RESULTS.GRANTED,
          writeStorage: manageStorageResult === RESULTS.GRANTED,
          manageStorage: manageStorageResult === RESULTS.GRANTED,
          fineLocation: results[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] === RESULTS.GRANTED,
          coarseLocation: results[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] === RESULTS.GRANTED,
        };
      } else {
        // Android < 11: Use traditional logic
        newStatus = {
          camera: results[PERMISSIONS.ANDROID.CAMERA] === RESULTS.GRANTED,
          readStorage: results[PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE] === RESULTS.GRANTED,
          writeStorage: results[PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE] === RESULTS.GRANTED,
          manageStorage: true, // Not applicable
          fineLocation: results[PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION] === RESULTS.GRANTED,
          coarseLocation: results[PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION] === RESULTS.GRANTED,
        };
      }

      setPermissionStatus(newStatus);

      // Check if we have the minimum required permissions
      const hasRequiredPermissions = isAndroid11Plus
        ? newStatus.camera && newStatus.fineLocation && newStatus.coarseLocation
        : Object.values(newStatus).every(status => status === true);
      
      setAllPermissionsGranted(hasRequiredPermissions);

      if (hasRequiredPermissions) {
        Alert.alert(
          'Success',
          'Required permissions granted! Navigating to video list...',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('VideoList'),
            },
          ]
        );
      } else {
        const message = isAndroid11Plus
          ? 'Some permissions were denied. Camera and Location are required. Storage permissions can be granted in Settings.'
          : 'Some permissions were denied. Please grant all permissions to continue.';
        
        Alert.alert(
          'Permissions Required',
          message,
          [
            { text: 'OK' },
            ...(isAndroid11Plus ? [{ 
              text: 'Open Settings', 
              onPress: () => openSettings().catch(() => Alert.alert('Error', 'Could not open settings'))
            }] : [])
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert(
        'Error',
        'Failed to request permissions. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const getPermissionText = (permission, status) => {
    const permissionNames = {
      camera: 'Camera',
      readStorage: 'Read Storage',
      writeStorage: 'Write Storage',
      manageStorage: 'Manage Storage',
      fineLocation: 'Fine Location',
      coarseLocation: 'Coarse Location',
    };

    return `${permissionNames[permission]}: ${status ? '✅ Granted' : '❌ Denied'}`;
  };

  const isAndroid11Plus = Platform.OS === 'android' && Platform.Version >= 30;
  const hasStorageIssues = !permissionStatus.readStorage || !permissionStatus.writeStorage;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Permissions Required</Text>
      <Text style={styles.description}>
        This app requires the following permissions to function properly:
      </Text>
      
      {isAndroid11Plus && (
        <Text style={styles.androidInfo}>
          Android {Platform.Version}: Storage permissions may require manual setup in Settings
        </Text>
      )}

      <View style={styles.permissionsList}>
        {Object.entries(permissionStatus).map(([permission, status]) => (
          <Text key={permission} style={styles.permissionItem}>
            {getPermissionText(permission, status)}
          </Text>
        ))}
      </View>

      {!allPermissionsGranted && (
        <TouchableOpacity style={styles.button} onPress={requestPermissions}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      )}

      {!allPermissionsGranted && isAndroid11Plus && hasStorageIssues && (
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => {
            openSettings().catch(() => {
              Alert.alert('Error', 'Could not open settings. Please open Settings manually and grant storage permissions to this app.');
            });
          }}
        >
          <Text style={styles.settingsButtonText}>Open App Settings</Text>
        </TouchableOpacity>
      )}

      {!allPermissionsGranted && (
        <TouchableOpacity style={styles.retryButton} onPress={checkPermissions}>
          <Text style={styles.retryButtonText}>Check Permissions Again</Text>
        </TouchableOpacity>
      )}

      {allPermissionsGranted && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.replace('VideoList')}
        >
          <Text style={styles.buttonText}>Continue to App</Text>
        </TouchableOpacity>
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 24,
  },
  permissionsList: {
    width: '100%',
    marginBottom: 30,
  },
  permissionItem: {
    fontSize: 16,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '80%',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '80%',
  },
  androidInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    color: '#FF9500',
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFEAA7',
    width: '100%',
  },
  settingsButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    width: '80%',
  },
  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default PermissionScreen;
