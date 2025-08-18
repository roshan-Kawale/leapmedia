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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PermissionUtils from '../utils/PermissionUtils';

const { width } = Dimensions.get('window');

const EnhancedPermissionScreen = ({ navigation }) => {
  const [permissionStatus, setPermissionStatus] = useState({});
  const [versionInfo, setVersionInfo] = useState({});
  const [allPermissionsGranted, setAllPermissionsGranted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [permissionDetails, setPermissionDetails] = useState([]);

  const checkPermissions = async () => {
    try {
      setLoading(true);
      const result = await PermissionUtils.checkAllPermissions();
      
      setPermissionStatus(result.permissions);
      setVersionInfo(result.versionInfo);
      setAllPermissionsGranted(result.allGranted);
      setPermissionDetails(PermissionUtils.getDetailedPermissionInfo(result.permissions));

      if (result.allGranted) {
        // Auto-navigate to VideoList if all permissions are granted
        setTimeout(() => {
          navigation.replace('VideoList');
        }, 1500);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      Alert.alert('Error', 'Failed to check permissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      setRequesting(true);
      const result = await PermissionUtils.requestAllPermissions();
      
      setPermissionStatus(result.permissions);
      setAllPermissionsGranted(result.allGranted);
      setPermissionDetails(PermissionUtils.getDetailedPermissionInfo(result.permissions));

      if (result.allGranted) {
        Alert.alert(
          'Success! 🎉',
          'All required permissions have been granted. You can now use the app.',
          [
            {
              text: 'Continue',
              onPress: () => navigation.replace('VideoList'),
            },
          ]
        );
      } else {
        handlePermissionDenied(result);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  const handlePermissionDenied = (result) => {
    const deniedPermissions = Object.keys(result.permissions)
      .filter(key => !result.permissions[key] && 
        PermissionUtils.isPermissionRequired(key, versionInfo));

    const deniedNames = deniedPermissions
      .map(key => PermissionUtils.getPermissionDisplayName(key));

    let message = `The following permissions are required:\n\n${deniedNames.join('\n')}`;
    
    if (versionInfo.isAndroid11Plus || versionInfo.isAndroid13Plus) {
      message += '\n\nSome permissions may require manual setup in Settings.';
    }

    const actions = [{ text: 'OK' }];
    
    // Add settings option for newer Android versions
    if (versionInfo.isAndroid11Plus) {
      actions.push({
        text: 'Open Settings',
        onPress: () => {
          PermissionUtils.showSettingsDialog(
            'Please grant the required permissions in Settings > Permissions',
            () => setTimeout(checkPermissions, 1000), // Re-check after settings
            () => {} // Do nothing on cancel
          );
        }
      });
    }

    Alert.alert('Permissions Required', message, actions);
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const renderPermissionItem = (item) => {
    const statusColor = item.granted ? '#4CAF50' : item.required ? '#F44336' : '#FF9800';
    const statusIcon = item.granted ? '✅' : item.required ? '❌' : '⚠️';
    const statusText = item.granted ? 'Granted' : item.required ? 'Required' : 'Optional';

    return (
      <View key={item.key} style={[styles.permissionCard, { borderLeftColor: statusColor }]}>
        <View style={styles.permissionHeader}>
          <Text style={styles.permissionName}>{statusIcon} {item.name}</Text>
          <Text style={[styles.permissionStatus, { color: statusColor }]}>
            {statusText}
          </Text>
        </View>
        <Text style={styles.permissionDescription}>{item.description}</Text>
        {item.required && !item.granted && (
          <Text style={styles.requiredNote}>This permission is required for the app to function</Text>
        )}
      </View>
    );
  };

  const renderVersionInfo = () => {
    if (!versionInfo.version) return null;

    return (
      <View style={styles.versionCard}>
        <Text style={styles.versionTitle}>Android {versionInfo.version}</Text>
        <Text style={styles.versionDescription}>
          {versionInfo.isAndroid13Plus && 'Uses granular media permissions for better privacy'}
          {versionInfo.isAndroid11Plus && !versionInfo.isAndroid13Plus && 'May require manual setup for storage access'}
          {versionInfo.isAndroid10Plus && !versionInfo.isAndroid11Plus && 'Uses scoped storage for better security'}
          {!versionInfo.isAndroid10Plus && 'Uses traditional permission model'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>App Permissions</Text>
          <Text style={styles.subtitle}>
            Grant the required permissions to access all features
          </Text>
        </View>

        {renderVersionInfo()}

        <View style={styles.permissionsContainer}>
          {permissionDetails.map(renderPermissionItem)}
        </View>

        <View style={styles.actionContainer}>
          {!allPermissionsGranted ? (
            <>
              <TouchableOpacity 
                style={[styles.primaryButton, requesting && styles.buttonDisabled]} 
                onPress={requestPermissions}
                disabled={requesting}
              >
                {requesting ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator size="small" color="#fff" style={styles.buttonLoader} />
                    <Text style={styles.buttonText}>Requesting...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Grant Permissions</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={checkPermissions}
                disabled={requesting}
              >
                <Text style={styles.secondaryButtonText}>Check Again</Text>
              </TouchableOpacity>

              {(versionInfo.isAndroid11Plus || versionInfo.isAndroid13Plus) && (
                <TouchableOpacity 
                  style={styles.tertiaryButton} 
                  onPress={() => {
                    PermissionUtils.showSettingsDialog(
                      'Open Settings to manually grant permissions that require special setup.',
                      () => setTimeout(checkPermissions, 1000),
                      () => {}
                    );
                  }}
                  disabled={requesting}
                >
                  <Text style={styles.tertiaryButtonText}>Open Settings</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>🎉 All permissions granted!</Text>
              <TouchableOpacity 
                style={styles.continueButton} 
                onPress={() => navigation.replace('VideoList')}
              >
                <Text style={styles.buttonText}>Continue to App</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  versionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  versionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  versionDescription: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
  permissionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  permissionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  permissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  permissionStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  permissionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  requiredNote: {
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoader: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    borderRadius: 8,
  },
  tertiaryButtonText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successText: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: width * 0.6,
  },
});

export default EnhancedPermissionScreen;
