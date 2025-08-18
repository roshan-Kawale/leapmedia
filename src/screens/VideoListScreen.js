import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const VideoListScreen = ({ navigation }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock video data for demonstration
  const mockVideos = [
    {
      id: '1',
      title: 'Sample Video 1',
      thumbnail: 'https://picsum.photos/300/200?random=1',
      duration: '0:30',
      size: '2.1 MB',
      uri: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
    },
    {
      id: '2',
      title: 'Sample Video 2',
      thumbnail: 'https://picsum.photos/300/200?random=2',
      duration: '0:45',
      size: '3.2 MB',
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    {
      id: '3',
      title: 'Sample Video 3',
      thumbnail: 'https://picsum.photos/300/200?random=3',
      duration: '1:15',
      size: '4.8 MB',
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    {
      id: '4',
      title: 'Sample Video 4',
      thumbnail: 'https://picsum.photos/300/200?random=4',
      duration: '0:58',
      size: '1.8 MB',
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
    {
      id: '5',
      title: 'Sample Video 5',
      thumbnail: 'https://picsum.photos/300/200?random=5',
      duration: '1:22',
      size: '2.5 MB',
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscape.mp4',
    },
  ];

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would scan the device for video files here
      // using the permissions we've already granted
      setVideos(mockVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const refreshVideos = () => {
    Alert.alert(
      'Refresh Videos',
      'This would scan the device for new videos using the storage permissions.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Refresh', onPress: loadVideos },
      ]
    );
  };

  const playVideo = (video) => {
    // Navigate to VideoPlayer with video data
    navigation.navigate('VideoPlayer', { video });
  };

  const renderVideoItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.videoItem} 
      onPress={() => playVideo(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>{item.title}</Text>
        <View style={styles.videoMeta}>
          <Text style={styles.videoDuration}>{item.duration}</Text>
          <Text style={styles.videoSize}>{item.size}</Text>
        </View>
      </View>
      {/* Play icon overlay */}
      <View style={styles.playIconContainer}>
        <View style={styles.playIcon}>
          <Text style={styles.playIconText}>▶</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Videos Found</Text>
      <Text style={styles.emptyDescription}>
        No video files were found on your device. Make sure you have videos in your gallery or camera roll.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={refreshVideos}>
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Video Library</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshVideos}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={renderVideoItem}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={videos.length === 0 ? styles.emptyListContainer : null}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {videos.length} video{videos.length !== 1 ? 's' : ''} found
        </Text>
        <Text style={styles.footerSubtext}>
          Tap any video to play in landscape mode with PiP recording
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  videoItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  thumbnail: {
    width: 120,
    height: 80,
    backgroundColor: '#ddd',
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playIcon: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 2, // Adjust for visual centering
  },
  videoInfo: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  videoDuration: {
    fontSize: 14,
    color: '#666',
  },
  videoSize: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  footer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default VideoListScreen;