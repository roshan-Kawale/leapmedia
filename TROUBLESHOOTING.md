# React Native Development Troubleshooting Guide

## "Unable to load script" Error

This error occurs when the React Native app can't connect to the Metro bundler. Here are the solutions:

### Solution 1: Set up ADB Port Forwarding
```bash
adb reverse tcp:8081 tcp:8081
```

### Solution 2: Check Device Connection
```bash
adb devices
```
Make sure your device appears in the list with "device" status.

### Solution 3: Restart ADB Server
```bash
adb kill-server
adb start-server
```

### Solution 4: Start Metro Manually
1. Open a new terminal
2. Run: `npx react-native start`
3. Wait for "Metro waiting on port 8081"
4. Reload the app

### Solution 5: Use WiFi Connection
If USB isn't working:
1. Connect your computer and device to the same WiFi
2. Find your computer's IP address: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Shake device → Dev Settings → Debug server host & port
4. Enter: `YOUR_IP_ADDRESS:8081`

## App Installation Issues

### "INSTALL_FAILED_USER_RESTRICTED"
1. Enable "Install via USB" in Developer Options
2. Enable "USB Debugging (Security Settings)" if available
3. Try: `adb install -r -t android/app/build/outputs/apk/debug/app-debug.apk`

### Device Not Found
1. Enable Developer Options (tap Build Number 7 times)
2. Enable USB Debugging
3. Allow USB Debugging when prompted on device
4. Try different USB cable/port

## Permission Testing

The app requests these permissions on first launch:
- Camera
- Read External Storage  
- Write External Storage
- Manage External Storage (Android 11+)
- Fine Location
- Coarse Location

### To test permissions:
1. Grant all permissions when prompted
2. If any are denied, use "Grant Permissions" button
3. Use "Check Permissions Again" to verify status
4. Once all granted, app navigates to Video List

## Common Commands

```bash
# Start development
npm run android

# Manual Metro start
npx react-native start

# Clean build
cd android && ./gradlew clean && cd ..
npm run android

# Reload app remotely
adb shell input keyevent 82

# View device logs
adb logcat | grep ReactNativeJS
```

## Development Scripts

Use the provided scripts for easier setup:
- `run-dev.bat` (Windows Batch)
- `run-dev.ps1` (PowerShell)

These scripts will:
1. Check device connection
2. Set up port forwarding
3. Start Metro bundler
4. Install and run the app
