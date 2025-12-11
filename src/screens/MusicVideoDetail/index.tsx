import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  StatusBar,
} from 'react-native';
import normalize from 'react-native-normalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
// @ts-ignore: react-native-video lacks bundled types.
import Video from 'react-native-video';

import { COLORS } from '../../config/color';
import { getApiInstance } from '../../utils/api';
import { useToast } from '../../components/Toast';

const FALLBACK_COVER =
  'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg?auto=compress&cs=tinysrgb&w=800';

const SCREEN_WIDTH = Dimensions.get('screen').width;
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16; // 16:9 aspect ratio

type RootStackParamList = {
  Home: undefined;
  MusicVideoDetail: {
    id: string;
    title: string;
    artist: string;
    cover: string;
    videoUrl?: string;
  };
};

type MusicVideoDetailRouteProp = RouteProp<RootStackParamList, 'MusicVideoDetail'>;
type MusicVideoDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MusicVideoDetail'
>;

type MusicVideoData = {
  id: number;
  title: string;
  artist_id: number;
  artist: string;
  release_date: string | null;
  duration: string;
  genre: string;
  description: string;
  video_url: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const MusicVideoDetailScreen: React.FC = () => {
  const navigation = useNavigation<MusicVideoDetailNavigationProp>();
  const route = useRoute<MusicVideoDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const { id } = route.params;

  const [musicVideoData, setMusicVideoData] = useState<MusicVideoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<Video>(null);
  const fullscreenVideoRef = useRef<Video>(null);

  // Format date dari ISO string ke format yang lebih readable
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const fetchMusicVideoDetail = useCallback(async () => {
    try {
      setLoading(true);
      const api = await getApiInstance();
      const response = await api.get(`/api/music-videos/${id}`);
      
      if (response.data?.success && response.data?.data) {
        setMusicVideoData(response.data.data);
      } else {
        showToast({
          message: 'Gagal memuat detail music video',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Error fetching music video detail:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Gagal memuat detail music video';
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchMusicVideoDetail();
  }, [fetchMusicVideoDetail]);

  const handlePlayPause = () => {
    if (!musicVideoData) return;

    const videoUrl = musicVideoData.video_url;
    const videoTitle = musicVideoData.title || route.params.title || 'Music Video';

    // Cek apakah video_url ada dan tidak kosong
    if (!videoUrl || videoUrl.trim() === '') {
      Alert.alert(
        'Video Tidak Tersedia',
        `Video untuk "${videoTitle}" tidak tersedia saat ini.\n\nSilakan coba lagi nanti.`,
        [
          {
            text: 'OK',
            style: 'default',
          },
        ],
      );
      return;
    }

    setIsPlaying(!isPlaying);
    setShowControls(true);
    
    // Auto hide controls setelah 3 detik
    setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Auto hide controls saat video diputar
  useEffect(() => {
    if (isPlaying && showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, showControls]);

  const handleFullscreen = () => {
    if (!musicVideoData || !musicVideoData.video_url || musicVideoData.video_url.trim() === '') {
      Alert.alert(
        'Video Tidak Tersedia',
        `Video untuk "${musicVideoData?.title || 'Music Video'}" tidak tersedia saat ini.`,
        [{ text: 'OK' }],
      );
      return;
    }
    setIsFullscreen(true);
    setShowControls(true);
    
    // Auto hide controls setelah 3 detik
    setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    setShowControls(true);
  };

  // Handle tap pada fullscreen untuk toggle controls
  const handleFullscreenTap = () => {
    setShowControls(!showControls);
    if (!showControls) {
      setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const handleVideoLoad = () => {
    setIsVideoLoading(false);
  };

  const handleVideoLoadStart = () => {
    setIsVideoLoading(true);
  };

  const handleVideoError = (error: any) => {
    console.error('Video error:', error);
    setIsVideoLoading(false);
    setIsPlaying(false);
    Alert.alert(
      'Error',
      'Terjadi kesalahan saat memuat video. Silakan coba lagi.',
      [
        {
          text: 'OK',
          style: 'default',
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Memuat detail music video...</Text>
      </View>
    );
  }

  if (!musicVideoData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Music video tidak ditemukan</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchMusicVideoDetail}
          activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const thumbnailImage = musicVideoData.thumbnail || route.params.cover || FALLBACK_COVER;
  const genreText = musicVideoData.genre ? ` • ${musicVideoData.genre}` : '';
  const durationText = musicVideoData.duration ? ` • ${musicVideoData.duration}` : '';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, normalize(16)) + normalize(20) }}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + normalize(10) }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}>
            <FontAwesome6 name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Music Video</Text>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
            <FontAwesome6 name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Video Player */}
        <View style={styles.videoContainer}>
          {musicVideoData.video_url && musicVideoData.video_url.trim() !== '' ? (
            <>
              <Video
                ref={videoRef}
                source={{ uri: musicVideoData.video_url }}
                style={styles.video}
                paused={!isPlaying}
                resizeMode="contain"
                onLoad={handleVideoLoad}
                onLoadStart={handleVideoLoadStart}
                onError={handleVideoError}
                controls={false}
                repeat={false}
              />
              {isVideoLoading && (
                <View style={styles.videoLoadingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={styles.loadingText}>Memuat video...</Text>
                </View>
              )}
              {showControls && (
                <View style={styles.videoControlsOverlay}>
                  <TouchableOpacity
                    style={styles.playPauseButton}
                    onPress={handlePlayPause}
                    activeOpacity={0.8}>
                    <FontAwesome6
                      name={isPlaying ? "pause" : "play"}
                      size={40}
                      color="#fff"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.fullscreenIconButton}
                    onPress={handleFullscreen}
                    activeOpacity={0.8}>
                    <FontAwesome6
                      name="maximize"
                      size={24}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <>
              <Image
                source={{ uri: thumbnailImage }}
                style={styles.video}
                resizeMode="cover"
              />
              <View style={styles.controlsOverlay}>
                <View style={styles.playPauseButton}>
                  <FontAwesome6
                    name="play"
                    size={40}
                    color="#fff"
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.fullscreenButton}
                  onPress={() => {
                    Alert.alert(
                      'Video Tidak Tersedia',
                      `Video untuk "${musicVideoData.title}" tidak tersedia saat ini.`,
                      [{ text: 'OK' }],
                    );
                  }}>
                  <FontAwesome6 name="play" size={20} color="#fff" />
                  <Text style={styles.fullscreenButtonText}>Putar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Video Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <Image source={{ uri: thumbnailImage }} style={styles.coverImage} />
            <View style={styles.infoText}>
              <Text style={styles.title}>{musicVideoData.title}</Text>
              <Text style={styles.artist}>
                {musicVideoData.artist}{durationText}{genreText}
              </Text>
              {musicVideoData.release_date && (
                <Text style={styles.releaseDate}>
                  Dirilis: {formatDate(musicVideoData.release_date)}
                </Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.actionButton}
              onPress={() => setIsLiked(!isLiked)}>
              <FontAwesome6 
                name={isLiked ? "heart" : "heart"} 
                size={24} 
                color={isLiked ? COLORS.primary : "rgba(255,255,255,0.7)"} 
                solid={isLiked}
              />
              <Text style={styles.actionText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={styles.actionButton}>
              <FontAwesome6 name="share-nodes" size={24} color="rgba(255,255,255,0.7)" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={styles.actionButton}>
              <FontAwesome6 name="download" size={24} color="rgba(255,255,255,0.7)" />
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} style={styles.actionButton}>
              <FontAwesome6 name="list" size={24} color="rgba(255,255,255,0.7)" />
              <Text style={styles.actionText}>Add to</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>About</Text>
            <Text style={styles.descriptionText}>
              {musicVideoData.description || `Official music video for "${musicVideoData.title}" by ${musicVideoData.artist}.`}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1.2M</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>45K</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2.3K</Text>
              <Text style={styles.statLabel}>Comments</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fullscreen Video Modal */}
      <Modal
        visible={isFullscreen}
        animationType="fade"
        supportedOrientations={['landscape', 'portrait']}
        onRequestClose={handleExitFullscreen}>
        <StatusBar hidden={isFullscreen} />
        <View style={styles.fullscreenContainer}>
          <Video
            ref={fullscreenVideoRef}
            source={{ uri: musicVideoData?.video_url || '' }}
            style={styles.fullscreenVideo}
            paused={!isPlaying}
            resizeMode="contain"
            onLoad={handleVideoLoad}
            onLoadStart={handleVideoLoadStart}
            onError={handleVideoError}
            controls={false}
            repeat={false}
            fullscreen={isFullscreen}
            fullscreenOrientation="all"
          />
          {isVideoLoading && (
            <View style={styles.fullscreenLoadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Memuat video...</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.fullscreenControlsOverlay}
            activeOpacity={1}
            onPress={handleFullscreenTap}>
            {showControls && (
              <>
                <View style={styles.fullscreenHeader}>
                  <TouchableOpacity
                    style={styles.exitFullscreenButton}
                    onPress={handleExitFullscreen}
                    activeOpacity={0.8}>
                    <FontAwesome6 name="xmark" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.fullscreenPlayPauseButton}
                  onPress={handlePlayPause}
                  activeOpacity={0.8}>
                  <FontAwesome6
                    name={isPlaying ? "pause" : "play"}
                    size={60}
                    color="#fff"
                  />
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.purple,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(10),
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '600',
  },
  headerButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: normalize(16),
  },
  videoControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: normalize(12),
  },
  playPauseButton: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(40),
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    backgroundColor: COLORS.primary,
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(12),
    borderRadius: normalize(999),
  },
  fullscreenButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '700',
  },
  infoContainer: {
    padding: normalize(20),
    gap: normalize(24),
  },
  infoHeader: {
    flexDirection: 'row',
    gap: normalize(16),
  },
  coverImage: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(12),
    backgroundColor: '#222',
  },
  infoText: {
    flex: 1,
    justifyContent: 'center',
    gap: normalize(4),
  },
  title: {
    color: '#fff',
    fontSize: normalize(20),
    fontWeight: '700',
  },
  artist: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(16),
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: normalize(16),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    alignItems: 'center',
    gap: normalize(8),
  },
  actionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(12),
  },
  descriptionContainer: {
    gap: normalize(12),
  },
  descriptionTitle: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '600',
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
    lineHeight: normalize(22),
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111',
    borderRadius: normalize(16),
    padding: normalize(20),
  },
  statItem: {
    alignItems: 'center',
    gap: normalize(4),
  },
  statNumber: {
    color: '#fff',
    fontSize: normalize(20),
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(16),
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(16),
    marginBottom: normalize(16),
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: normalize(24),
    paddingVertical: normalize(12),
    borderRadius: normalize(999),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  releaseDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
    marginTop: normalize(4),
  },
  fullscreenIconButton: {
    position: 'absolute',
    bottom: normalize(16),
    right: normalize(16),
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  fullscreenControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: normalize(50),
    paddingHorizontal: normalize(20),
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  exitFullscreenButton: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(22),
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenPlayPauseButton: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(50),
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    gap: normalize(12),
  },
});

export default MusicVideoDetailScreen;

