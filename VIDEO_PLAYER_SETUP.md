# Video Player Setup Guide

## Current Implementation
The app now includes a working video player screen that demonstrates the UI and flow for the requested functionality. Currently, it uses placeholder elements for the video player and camera preview.

## To Enable Full Functionality

### 1. Install Required Packages

Run the following commands in your project directory:

```bash
npm install react-native-video react-native-camera react-native-orientation-locker
```

### 2. Platform-Specific Setup

#### Android
Add the following permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

#### iOS
Add the following keys to `ios/VideoPermissionsApp/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to record your reactions to videos</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access to record audio during video reactions</string>
```

### 3. Link Native Modules

For React Native 0.60+, the packages should auto-link. If you encounter issues:

```bash
npx react-native link react-native-video
npx react-native link react-native-camera
npx react-native link react-native-orientation-locker
```

### 4. Rebuild the App

After installing packages:

```bash
# Clean and rebuild
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

## Features Implemented

✅ **Video List Screen** - Scrollable list of videos with thumbnails
✅ **Video Player Screen** - Fullscreen landscape video player
✅ **PiP Camera Preview** - Camera preview in corner (currently simulated)
✅ **Play & Record** - Simultaneous video playback and camera recording
✅ **No Controls** - Hidden video controls during playback
✅ **Auto Stop** - Recording stops when video ends

## Current Demo Features

- **Video Selection**: Click any video from the list to open the player
- **Fullscreen Experience**: Landscape-oriented video player screen
- **Camera Preview**: Simulated PiP camera preview in top-right corner
- **Play Button**: Large play button overlay when video is paused
- **Recording Simulation**: Shows recording status and camera feedback
- **Video Progress**: Simulated video timeline and duration
- **Navigation**: Back button to return to video list

## Next Steps

1. Install the required packages
2. Follow platform-specific setup instructions
3. Rebuild the app
4. Test with actual video files and camera functionality

## Troubleshooting

- If you encounter build errors, ensure all native dependencies are properly linked
- For camera issues, verify permissions are granted at runtime
- For video playback issues, check that video files are accessible and in supported formats

## Supported Video Formats

- MP4 (H.264)
- MOV
- AVI
- WebM

## Camera Recording Quality

- Video: 480p (configurable)
- Audio: AAC codec
- Bitrate: 1Mbps video, 128kbps audio

