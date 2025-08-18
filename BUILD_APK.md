# Building APK for Testing

This guide will help you build an APK file for testing your VideoPermissionsApp.

## Prerequisites

Before building, ensure you have:
- ✅ Node.js (version 18 or higher)
- ✅ Java Development Kit (JDK) 17 or higher
- ✅ Android SDK and build tools
- ✅ React Native CLI installed globally: `npm install -g @react-native-community/cli`

## Quick Build Methods

### Method 1: Using PowerShell Script (Recommended for Windows)
```powershell
.\build-apk.ps1
```

### Method 2: Using Batch File
```cmd
build-apk.bat
```

### Method 3: Using NPM Script
```bash
npm run build:android
```

### Method 4: Manual Build
```bash
cd android
./gradlew assembleDebug
cd ..
```

## What Gets Built

- **Build Type**: Debug APK (suitable for testing)
- **Signing**: Uses debug keystore (automatically generated)
- **Output Location**: 
  - Original: `android/app/build/outputs/apk/debug/`
  - Copied to: Project root as `VideoPermissionsApp-debug.apk`

## Build Output

After a successful build, you'll see:
- ✅ APK built successfully message
- 📱 APK file location
- 📏 APK file size
- 📋 Copy confirmation to project root

## Troubleshooting

### Common Issues

1. **Gradle Build Failed**
   - Ensure you have JDK 17+ installed
   - Check Android SDK path in environment variables
   - Try cleaning the project: `cd android && ./gradlew clean`

2. **Permission Denied on gradlew**
   - Make gradlew executable: `chmod +x android/gradlew`

3. **Memory Issues**
   - Increase Gradle memory in `android/gradle.properties`:
     ```
     org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m
     ```

4. **SDK Version Issues**
   - Check `android/build.gradle` for compatible SDK versions
   - Ensure Android SDK tools are up to date

### Build Variants

- **Debug APK**: `./gradlew assembleDebug` (what we're building)
- **Release APK**: `./gradlew assembleRelease` (requires signing configuration)

## Testing the APK

1. **Install on Device**: Transfer the APK to your Android device and install
2. **Enable Unknown Sources**: Allow installation from unknown sources in device settings
3. **Test Permissions**: Verify camera and storage permissions work correctly

## Next Steps

After building and testing:
- Fix any issues found during testing
- Update version numbers in `android/app/build.gradle` if needed
- Consider building a release APK for production

## Support

If you encounter build issues:
1. Check the error messages in the terminal
2. Verify all prerequisites are met
3. Try cleaning and rebuilding: `cd android && ./gradlew clean && ./gradlew assembleDebug`
