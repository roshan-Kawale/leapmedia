import { Platform, Alert } from 'react-native';
import { 
  check, 
  request, 
  requestMultiple, 
  PERMISSIONS, 
  RESULTS, 
  openSettings 
} from 'react-native-permissions';

class PermissionUtils {
  constructor() {
    this.androidVersion = Platform.Version;
  }

  /**
   * Get Android version categories
   */
  getAndroidVersionInfo() {
    const version = this.androidVersion;
    return {
      version,
      isAndroid6Plus: version >= 23,   // Runtime permissions introduced
      isAndroid10Plus: version >= 29,  // Scoped storage introduced
      isAndroid11Plus: version >= 30,  // MANAGE_EXTERNAL_STORAGE introduced
      isAndroid12Plus: version >= 31,  // New permission dialog behavior
      isAndroid13Plus: version >= 33,  // Granular media permissions
      isAndroid14Plus: version >= 34,  // Additional privacy features
    };
  }

  /**
   * Get required permissions based on Android version
   */
  getRequiredPermissions() {
    const versionInfo = this.getAndroidVersionInfo();
    
    let permissions = [
      PERMISSIONS?.ANDROID?.CAMERA,
      PERMISSIONS?.ANDROID?.ACCESS_FINE_LOCATION,
      PERMISSIONS?.ANDROID?.ACCESS_COARSE_LOCATION,
    ];

    // Storage permissions based on Android version
    if (versionInfo.isAndroid13Plus) {
      // Android 13+: Use granular media permissions
      permissions.push(
        PERMISSIONS?.ANDROID?.READ_MEDIA_VIDEO,
        PERMISSIONS?.ANDROID?.READ_MEDIA_IMAGES,
        // PERMISSIONS?.ANDROID?.READ_MEDIA_AUDIO, // Uncomment if you need audio access
      );
    } else if (versionInfo.isAndroid10Plus) {
      // Android 10-12: Still use READ_EXTERNAL_STORAGE
      permissions.push(PERMISSIONS?.ANDROID?.READ_EXTERNAL_STORAGE);
    } else {
      // Android 9 and below: Use both read and write
      permissions.push(
        PERMISSIONS?.ANDROID?.READ_EXTERNAL_STORAGE,
        PERMISSIONS?.ANDROID?.WRITE_EXTERNAL_STORAGE
      );
    }

    // Filter out any undefined/invalid entries and dedupe
    return Array.from(new Set(permissions.filter(this.isValidPermission)));
  }

  /**
   * Get special permissions that need separate handling
   */
  getSpecialPermissions() {
    const versionInfo = this.getAndroidVersionInfo();
    const specialPermissions = [];

    // MANAGE_EXTERNAL_STORAGE for Android 11+
    if (versionInfo.isAndroid11Plus) {
      specialPermissions.push({
        permission: PERMISSIONS?.ANDROID?.MANAGE_EXTERNAL_STORAGE,
        name: 'All Files Access',
        description: 'Allows the app to access all files on external storage',
        requiresSettings: true,
      });
    }

    // Filter out entries with invalid permission strings
    return specialPermissions.filter(p => this.isValidPermission(p.permission));
  }

  /**
   * Check all permissions status
   */
  async checkAllPermissions() {
    try {
      const regularPermissions = this.getRequiredPermissions();
      const specialPermissions = this.getSpecialPermissions();
      
      // Check regular permissions
      const regularResults = await Promise.all(
        regularPermissions.map(permission => check(permission))
      );
      
      // Check special permissions
      const specialResults = await Promise.all(
        specialPermissions.map(({ permission }) => 
          check(permission).catch(() => RESULTS.UNAVAILABLE)
        )
      );

      // Combine results
      const permissionStatus = {};
      
      regularPermissions.forEach((permission, index) => {
        const key = this.getPermissionKey(permission);
        permissionStatus[key] = regularResults[index] === RESULTS.GRANTED;
      });

      specialPermissions.forEach(({ permission }, index) => {
        const key = this.getPermissionKey(permission);
        permissionStatus[key] = specialResults[index] === RESULTS.GRANTED;
      });

      return {
        permissions: permissionStatus,
        allGranted: this.areRequiredPermissionsGranted(permissionStatus),
        versionInfo: this.getAndroidVersionInfo(),
      };
    } catch (error) {
      console.error('Error checking permissions:', error);
      throw error;
    }
  }

  /**
   * Request all required permissions
   */
  async requestAllPermissions() {
    try {
      const regularPermissions = this.getRequiredPermissions();
      const specialPermissions = this.getSpecialPermissions();
      
      // Request regular permissions first
      const regularResults = await requestMultiple(regularPermissions);
      
      // Handle special permissions
      const specialResults = {};
      for (const { permission, requiresSettings } of specialPermissions) {
        if (requiresSettings) {
          // For permissions that require settings (like MANAGE_EXTERNAL_STORAGE)
          try {
            const result = await request(permission);
            specialResults[permission] = result;
          } catch (error) {
            console.log(`Failed to request ${permission}:`, error);
            specialResults[permission] = RESULTS.DENIED;
          }
        } else {
          try {
            const result = await request(permission);
            specialResults[permission] = result;
          } catch (error) {
            console.log(`Failed to request ${permission}:`, error);
            specialResults[permission] = RESULTS.DENIED;
          }
        }
      }

      // Combine results
      const allResults = { ...regularResults, ...specialResults };
      
      // Convert to our status format
      const permissionStatus = {};
      Object.keys(allResults).forEach(permission => {
        const key = this.getPermissionKey(permission);
        permissionStatus[key] = allResults[permission] === RESULTS.GRANTED;
      });

      return {
        permissions: permissionStatus,
        results: allResults,
        allGranted: this.areRequiredPermissionsGranted(permissionStatus),
      };
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    }
  }

  /**
   * Get permission key for our status object
   */
  getPermissionKey(permission) {
    const keyMap = {
      [PERMISSIONS.ANDROID.CAMERA]: 'camera',
      [PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]: 'fineLocation',
      [PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION]: 'coarseLocation',
      [PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE]: 'readStorage',
      [PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE]: 'writeStorage',
      [PERMISSIONS.ANDROID.MANAGE_EXTERNAL_STORAGE]: 'manageStorage',
      [PERMISSIONS.ANDROID.READ_MEDIA_VIDEO]: 'readMediaVideo',
      [PERMISSIONS.ANDROID.READ_MEDIA_IMAGES]: 'readMediaImages',
      [PERMISSIONS.ANDROID.READ_MEDIA_AUDIO]: 'readMediaAudio',
    };
    
    return keyMap[permission] || 'unknown';
  }

  /**
   * Validate permission string is usable by react-native-permissions
   */
  isValidPermission = (permission) => {
    return typeof permission === 'string' && permission.startsWith('android.permission.');
  }

  /**
   * Get human-readable permission names
   */
  getPermissionDisplayName(key) {
    const nameMap = {
      camera: 'Camera',
      fineLocation: 'Precise Location',
      coarseLocation: 'Approximate Location',
      readStorage: 'Read Storage',
      writeStorage: 'Write Storage',
      manageStorage: 'All Files Access',
      readMediaVideo: 'Access Videos',
      readMediaImages: 'Access Images',
      readMediaAudio: 'Access Audio',
    };
    
    return nameMap[key] || key;
  }

  /**
   * Get permission descriptions
   */
  getPermissionDescription(key) {
    const descriptionMap = {
      camera: 'Take photos and record videos',
      fineLocation: 'Access your precise location using GPS',
      coarseLocation: 'Access your approximate location',
      readStorage: 'Read files from device storage',
      writeStorage: 'Write files to device storage',
      manageStorage: 'Access all files on your device',
      readMediaVideo: 'Access video files on your device',
      readMediaImages: 'Access image files on your device',
      readMediaAudio: 'Access audio files on your device',
    };
    
    return descriptionMap[key] || 'Required for app functionality';
  }

  /**
   * Check if required permissions are granted based on Android version
   */
  areRequiredPermissionsGranted(permissionStatus) {
    const versionInfo = this.getAndroidVersionInfo();
    
    // Camera and location are always required
    const baseRequirements = [
      permissionStatus.camera,
      permissionStatus.fineLocation || permissionStatus.coarseLocation, // At least one location permission
    ];

    // Storage requirements based on Android version
    let storageRequirements = [];
    
    if (versionInfo.isAndroid13Plus) {
      // Android 13+: Require granular media permissions
      storageRequirements = [
        permissionStatus.readMediaVideo,
        permissionStatus.readMediaImages,
      ];
    } else if (versionInfo.isAndroid11Plus) {
      // Android 11-12: Either MANAGE_EXTERNAL_STORAGE or READ_EXTERNAL_STORAGE
      storageRequirements = [
        permissionStatus.manageStorage || permissionStatus.readStorage
      ];
    } else if (versionInfo.isAndroid10Plus) {
      // Android 10: READ_EXTERNAL_STORAGE
      storageRequirements = [permissionStatus.readStorage];
    } else {
      // Android 9 and below: Both read and write
      storageRequirements = [
        permissionStatus.readStorage,
        permissionStatus.writeStorage,
      ];
    }

    return [...baseRequirements, ...storageRequirements].every(Boolean);
  }

  /**
   * Show permission rationale dialog
   */
  showPermissionRationale(deniedPermissions, onAccept, onCancel) {
    const permissionNames = deniedPermissions
      .map(key => this.getPermissionDisplayName(key))
      .join(', ');

    Alert.alert(
      'Permissions Required',
      `This app requires the following permissions to function properly:\n\n${permissionNames}\n\nWould you like to grant these permissions?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'Grant Permissions',
          onPress: onAccept,
        },
      ]
    );
  }

  /**
   * Show settings dialog for permissions that require manual setup
   */
  showSettingsDialog(message, onOpenSettings, onCancel) {
    Alert.alert(
      'Permission Setup Required',
      message || 'Some permissions require manual setup in the app settings. Would you like to open settings now?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: 'Open Settings',
          onPress: () => {
            openSettings().catch(() => {
              Alert.alert('Error', 'Could not open settings. Please open Settings > Apps > VideoPermissionsApp > Permissions manually.');
            });
            if (onOpenSettings) onOpenSettings();
          },
        },
      ]
    );
  }

  /**
   * Get detailed permission information for display
   */
  getDetailedPermissionInfo(permissionStatus) {
    const versionInfo = this.getAndroidVersionInfo();
    const details = [];

    Object.keys(permissionStatus).forEach(key => {
      if (permissionStatus[key] !== undefined) {
        details.push({
          key,
          name: this.getPermissionDisplayName(key),
          description: this.getPermissionDescription(key),
          granted: permissionStatus[key],
          required: this.isPermissionRequired(key, versionInfo),
        });
      }
    });

    return details.sort((a, b) => {
      // Sort by required first, then alphabetically
      if (a.required && !b.required) return -1;
      if (!a.required && b.required) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Check if a permission is required for the current Android version
   */
  isPermissionRequired(key, versionInfo) {
    const alwaysRequired = ['camera', 'fineLocation', 'coarseLocation'];
    
    if (alwaysRequired.includes(key)) return true;

    // Storage permission requirements based on version
    if (versionInfo.isAndroid13Plus) {
      return ['readMediaVideo', 'readMediaImages'].includes(key);
    } else if (versionInfo.isAndroid11Plus) {
      return ['manageStorage', 'readStorage'].includes(key);
    } else if (versionInfo.isAndroid10Plus) {
      return key === 'readStorage';
    } else {
      return ['readStorage', 'writeStorage'].includes(key);
    }
  }
}

export default new PermissionUtils();
