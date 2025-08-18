import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import { RNCamera } from 'react-native-camera';
import Orientation from 'react-native-orientation-locker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import CameraRoll from '@react-native-camera-roll/camera-roll';
import { Video as VideoCompressor } from 'react-native-compressor';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VideoPlayerScreen = ({ route, navigation }) => {
  const { video } = route.params;
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [cameraPosition, setCameraPosition] = useState('topRight');

  const controlsTimer = useRef(null);
  const recordingTimer = useRef(null);

  useEffect(() => {
    // Lock to landscape when component mounts
    Orientation.lockToLandscape();
    
    // Hide status bar for fullscreen experience
    StatusBar.setHidden(true);

    // Handle back button
    const backAction = () => {
      handleBackPress();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => {
      // Cleanup
      Orientation.unlockAllOrientations();
      StatusBar.setHidden(false);
      backHandler.remove();
      if (controlsTimer.current) {
        clearTimeout(controlsTimer.current);
      }
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showControls) {
      hideControlsAfterDelay();
    }
  }, [showControls]);

  const handleBackPress = () => {
    if (isRecording) {
      Alert.alert(
        'Recording in Progress',
        'Stop recording before going back?',
        [
          { text: 'Continue Recording', style: 'cancel' },
          { 
            text: 'Stop & Go Back', 
            onPress: () => {
              stopRecording();
              navigation.goBack();
            }
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const hideControlsAfterDelay = () => {
    if (controlsTimer.current) {
      clearTimeout(controlsTimer.current);
    }
    controlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const togglePlayPause = () => {
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    setShowControls(true);
    if (nextPlaying && showCamera && isCameraReady && !isRecording) {
      startRecording();
    }
  };

  const onProgress = (data) => {
    setCurrentTime(data.currentTime);
  };

  const onLoad = (data) => {
    setDuration(data.duration);
    setIsLoading(false);
  };

  const onError = (error) => {
    console.error('Video error:', error);
    Alert.alert('Error', 'Failed to load video');
    setIsLoading(false);
  };

  const onEnd = () => {
    setIsPlaying(false);
    if (isRecording) {
      stopRecording();
    }
    setShowControls(true);
  };

  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.seek(time);
    }
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (!cameraRef.current || !isCameraReady) {
      Alert.alert('Error', 'Camera is not ready');
      return;
    }

    try {
      const options = {
        quality: RNCamera.Constants.VideoQuality['720p'],
        maxDuration: 300, // 5 minutes max
        mute: false,
      };

      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingTimer.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);

      const promise = cameraRef.current.recordAsync(options);
      const data = await promise; // resolves when stopRecording is called or duration elapsed

      // Persist the recorded file into app's documents directory
      const timestamp = Date.now();
      const targetDir = `${RNFS.DocumentDirectoryPath}/recordings`;
      const targetPath = `${targetDir}/recording_${timestamp}.mp4`;

      try {
        // Ensure target directory exists
        const dirExists = await RNFS.exists(targetDir);
        if (!dirExists) {
          await RNFS.mkdir(targetDir);
        }
        // Move the temp file to our app folder
        await RNFS.moveFile(data.uri.replace('file://', ''), targetPath);
        console.log('Recording moved to app storage:', targetPath);

        // Transcode to 960x540 @ 25fps using react-native-compressor
        let finalOutputPath = targetPath;
        try {
          const compressedPath = await VideoCompressor.compress(
            `file://${targetPath}`,
            {
              compressionMethod: 'auto',
              maxSize: 640,
              bitrate: 1000000,
              fps: 25,
              minimumFileSizeForCompress: 0,
            },
            () => {}
          );
          if (compressedPath && typeof compressedPath === 'string') {
            const localCompressed = compressedPath.replace('file://', '');
            try { await RNFS.unlink(targetPath); } catch (e) {}
            await RNFS.moveFile(localCompressed, targetPath);
            finalOutputPath = targetPath;
            console.log('Compression done:', finalOutputPath);
          }
        } catch (cErr) {
          console.warn('Compression failed, using original:', cErr);
        }

        // Also copy to the device Downloads/VideoPermissionsApp folder for easy access
        try {
          const downloadsDir = `${RNFS.DownloadDirectoryPath}/VideoPermissionsApp`;
          const downloadsTarget = `${downloadsDir}/recording_${timestamp}.mp4`;
          const downloadsExists = await RNFS.exists(downloadsDir);
          if (!downloadsExists) {
            await RNFS.mkdir(downloadsDir);
          }
          await RNFS.copyFile(finalOutputPath, downloadsTarget);
          console.log('Recording copied to Downloads:', downloadsTarget);
        } catch (dlErr) {
          console.warn('Failed to copy to Downloads:', dlErr);
        }

        // Also save to the device gallery (Camera Roll)
        try {
          await CameraRoll.save(`file://${finalOutputPath}`, { type: 'video', album: 'VideoPermissionsApp' });
          Alert.alert('Saved', 'Recording saved to Gallery and Downloads/VideoPermissionsApp.');
        } catch (galleryErr) {
          console.warn('Failed to save to gallery:', galleryErr);
          Alert.alert('Saved', 'Recording saved to app storage and Downloads/VideoPermissionsApp.');
        }
      } catch (fsErr) {
        console.error('Failed to save recording:', fsErr);
        Alert.alert('Save Error', 'Recording completed but failed to save.');
      }
      
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to record video');
    } finally {
      setIsRecording(false);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const toggleCamera = () => {
    setShowCamera(!showCamera);
  };

  useEffect(() => {
    if (isCameraReady && isPlaying && showCamera && !isRecording) {
      startRecording();
    }
  }, [isCameraReady, isPlaying, showCamera, isRecording]);

  const cycleCameraPosition = () => {
    const positions = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'];
    const currentIndex = positions.indexOf(cameraPosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    setCameraPosition(positions[nextIndex]);
  };

  const getCameraStyle = () => {
    const size = 120;
    const margin = 20;
    
    switch (cameraPosition) {
      case 'topLeft':
        return { top: margin, left: margin };
      case 'topRight':
        return { top: margin, right: margin };
      case 'bottomLeft':
        return { bottom: margin + 60, left: margin };
      case 'bottomRight':
      default:
        return { bottom: margin + 60, right: margin };
    }
  };

  const onScreenTouch = () => {
    setShowControls(!showControls);
  };

  return (
    <View style={styles.container}>
      {/* Main Video Player */}
      <TouchableOpacity 
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={onScreenTouch}
      >
        <Video
          ref={videoRef}
          source={{ uri: video.uri }}
          style={styles.video}
          onLoad={onLoad}
          onProgress={onProgress}
          onEnd={onEnd}
          onError={onError}
          paused={!isPlaying}
          resizeMode="contain"
          repeat={false}
        />

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {/* PiP Camera */}
        {showCamera && (
          <View style={[styles.cameraContainer, getCameraStyle()]}>
            <RNCamera
              ref={cameraRef}
              style={styles.camera}
              type={RNCamera.Constants.Type.front}
              flashMode={RNCamera.Constants.FlashMode.off}
              androidCameraPermissionOptions={{
                title: 'Permission to use camera',
                message: 'We need your permission to use your camera',
                buttonPositive: 'Ok',
                buttonNegative: 'Cancel',
              }}
              androidRecordAudioPermissionOptions={{
                title: 'Permission to use audio recording',
                message: 'We need your permission to use your audio',
                buttonPositive: 'Ok',
                buttonNegative: 'Cancel',
              }}
              onCameraReady={() => setIsCameraReady(true)}
            />
            
            {/* Camera controls */}
            <View style={styles.cameraControls}>
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={cycleCameraPosition}
              >
                <Icon name="open-with" size={16} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={toggleCamera}
              >
                <Icon name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Recording indicator */}
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  {formatTime(recordingTime)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Video Controls Overlay */}
        {showControls && (
          <View style={styles.controlsOverlay}>
            {/* Top Controls */}
            <SafeAreaView style={styles.topControls}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBackPress}
              >
                <Icon name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              
              <Text style={styles.videoTitle} numberOfLines={1}>
                {video.title}
              </Text>
              
              <View style={styles.topRightControls}>
                {!showCamera && (
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={toggleCamera}
                  >
                    <Icon name="videocam" size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </SafeAreaView>

            {/* Center Play Button */}
            {!isLoading && (
              <TouchableOpacity 
                style={styles.centerPlayButton}
                onPress={togglePlayPause}
              >
                <Icon 
                  name={isPlaying ? "pause" : "play-arrow"} 
                  size={60} 
                  color="#fff" 
                />
              </TouchableOpacity>
            )}

            {/* Bottom Controls */}
            <SafeAreaView style={styles.bottomControls}>
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>
                  {formatTime(currentTime)}
                </Text>
                
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(currentTime / duration) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
                
                <Text style={styles.timeText}>
                  {formatTime(duration)}
                </Text>
              </View>

              {/* Recording is now automatic with playback; manual button removed */}
            </SafeAreaView>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: screenWidth,
    height: screenHeight,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  cameraContainer: {
    position: 'absolute',
    width: 120,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
  },
  cameraButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
    marginLeft: 4,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff0000',
    marginRight: 4,
  },
  recordingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 10,
  },
  videoTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 15,
  },
  topRightControls: {
    flexDirection: 'row',
  },
  controlButton: {
    padding: 10,
    marginLeft: 10,
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 35,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    minWidth: 45,
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  recordButtonActive: {
    backgroundColor: 'rgba(255,0,0,1)',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default VideoPlayerScreen;