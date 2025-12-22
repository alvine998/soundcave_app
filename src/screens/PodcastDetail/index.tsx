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
const COVER_HEIGHT = (SCREEN_WIDTH * 9) / 16; // 16:9 aspect ratio

type RootStackParamList = {
  Home: undefined;
  PodcastDetail: {
    id: string;
    title: string;
    duration: string;
    cover: string;
    audioUrl?: string;
  };
};

type PodcastDetailRouteProp = RouteProp<RootStackParamList, 'PodcastDetail'>;
type PodcastDetailNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PodcastDetail'
>;

type PodcastData = {
  id: number;
  title: string;
  host: string;
  release_date: string | null;
  duration: string;
  category: string;
  description: string;
  episode_number: number | null;
  season: number;
  video_url: string;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const PodcastDetailScreen: React.FC = () => {
  const navigation = useNavigation<PodcastDetailNavigationProp>();
  const route = useRoute<PodcastDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const { id } = route.params;

  const [podcastData, setPodcastData] = useState<PodcastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<Video>(null);
  const fullscreenVideoRef = useRef<Video>(null);

  // Format duration dari "42:15" ke "42 min"
  const formatDuration = (duration: string): string => {
    if (!duration) return '0 min';
    if (duration.includes(':') && duration.split(':').length === 2) {
      const [minutes] = duration.split(':');
      const totalMinutes = parseInt(minutes, 10);
      return `${totalMinutes} min`;
    }
    return duration;
  };

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

  const fetchPodcastDetail = useCallback(async () => {
    try {
      setLoading(true);
      const api = await getApiInstance();
      const response = await api.get(`/api/podcasts/${id}`);
      
      if (response.data?.success && response.data?.data) {
        setPodcastData(response.data.data);
      } else {
        showToast({
          message: 'Gagal memuat detail podcast',
          type: 'error',
        });
      }
    } catch (error: any) {
      console.error('Error fetching podcast detail:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Gagal memuat detail podcast';
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchPodcastDetail();
  }, [fetchPodcastDetail]);

  const handlePlayPause = () => {
    if (!podcastData) return;

    const videoUrl = podcastData.video_url;
    const podcastTitle = podcastData.title || route.params.title || 'Podcast';

    // Cek apakah video_url ada dan tidak kosong
    if (!videoUrl || videoUrl.trim() === '') {
    Alert.alert(
        'Video Tidak Tersedia',
        `Video untuk podcast "${podcastTitle}" tidak tersedia saat ini.\n\nSilakan coba lagi nanti.`,
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
    if (!podcastData || !podcastData.video_url || podcastData.video_url.trim() === '') {
      Alert.alert(
        'Video Tidak Tersedia',
        `Video untuk "${podcastData?.title || 'Podcast'}" tidak tersedia saat ini.`,
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

  // Handle tap pada video area untuk toggle controls
  const handleVideoTap = () => {
    if (isPlaying) {
      setShowControls(!showControls);
      if (!showControls) {
        setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
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
        <Text style={styles.loadingText}>Memuat detail podcast...</Text>
      </View>
    );
  }

  if (!podcastData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Podcast tidak ditemukan</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchPodcastDetail}
          activeOpacity={0.8}>
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const coverImage = podcastData.thumbnail || route.params.cover || FALLBACK_COVER;
  const formattedDuration = formatDuration(podcastData.duration);
  const categoryText = podcastData.category ? ` • ${podcastData.category}` : '';
  const hostText = podcastData.host ? `Host: ${podcastData.host}` : '';

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
          <Text style={styles.headerTitle}>Podcast</Text>
          <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
            <FontAwesome6 name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Podcast Cover/Video */}
        <View style={styles.playerContainer}>
          {podcastData.video_url && podcastData.video_url.trim() !== '' ? (
            <>
              <Video
                ref={videoRef}
                source={{ uri: podcastData.video_url }}
                style={styles.playerCover}
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
              <TouchableOpacity
                style={styles.videoControlsOverlay}
                activeOpacity={1}
                onPress={handleVideoTap}>
                {showControls && (
                  <>
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
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
          <Image
                source={{ uri: coverImage }}
            style={styles.playerCover}
            resizeMode="cover"
          />
          <View style={styles.coverOverlay}>
            <View style={styles.podcastBadge}>
              <FontAwesome6 name="podcast" size={32} color="#fff" />
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.fullscreenButton}
                  onPress={() => {
                    Alert.alert(
                      'Video Tidak Tersedia',
                      `Video untuk "${podcastData.title}" tidak tersedia saat ini.`,
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

        {/* Podcast Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <View style={styles.infoText}>
              <Text style={styles.title}>{podcastData.title}</Text>
              <Text style={styles.duration}>
                {formattedDuration}{categoryText}
                {hostText ? ` • ${hostText}` : ''}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={styles.actionButton}
              onPress={() => setIsLiked(!isLiked)}>
              <FontAwesome6 
                name="heart" 
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
              <FontAwesome6 name="bell" size={24} color="rgba(255,255,255,0.7)" />
              <Text style={styles.actionText}>Subscribe</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>About</Text>
            <Text style={styles.descriptionText}>
              {podcastData.description || 'Tidak ada deskripsi tersedia.'}
            </Text>
            {podcastData.release_date && (
              <Text style={styles.releaseDate}>
                Dirilis: {formatDate(podcastData.release_date)}
              </Text>
            )}
          </View>

          {/* Episodes List - Menampilkan podcast sebagai episode tunggal jika tidak ada episode list */}
          <View style={styles.episodesContainer}>
            <Text style={styles.episodesTitle}>Episode Info</Text>
            <View style={styles.episodesList}>
              <View style={styles.episodeCard}>
                  <View style={styles.episodeNumber}>
                  <Text style={styles.episodeNumberText}>
                    {podcastData.episode_number || '1'}
                  </Text>
                  </View>
                  <View style={styles.episodeInfo}>
                    <Text style={styles.episodeTitle} numberOfLines={2}>
                    {podcastData.title}
                    </Text>
                  <Text style={styles.episodeDescription} numberOfLines={3}>
                    {podcastData.description || 'Tidak ada deskripsi tersedia.'}
                    </Text>
                    <View style={styles.episodeMeta}>
                    <Text style={styles.episodeMetaText}>{formattedDuration}</Text>
                    {podcastData.release_date && (
                      <>
                        <Text style={styles.episodeMetaText}>•</Text>
                        <Text style={styles.episodeMetaText}>
                          {formatDate(podcastData.release_date)}
                        </Text>
                      </>
                    )}
                    {podcastData.season && (
                      <>
                      <Text style={styles.episodeMetaText}>•</Text>
                        <Text style={styles.episodeMetaText}>Season {podcastData.season}</Text>
                      </>
                    )}
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.episodePlayButton}
                  onPress={handlePlayPause}>
                    <FontAwesome6
                    name={isPlaying ? "pause" : "play"}
                      size={16}
                      color="#fff"
                    />
                </TouchableOpacity>
              </View>
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
            source={{ uri: podcastData?.video_url || '' }}
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
                <View style={styles.fullscreenPlayPauseButton}>
                  <TouchableOpacity
                    onPress={handlePlayPause}
                    activeOpacity={0.8}>
                    <FontAwesome6
                      name={isPlaying ? "pause" : "play"}
                      size={60}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
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
  playerContainer: {
    width: SCREEN_WIDTH,
    height: COVER_HEIGHT,
    backgroundColor: '#000',
    position: 'relative',
  },
  playerCover: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: normalize(16),
  },
  videoControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: normalize(16),
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
  podcastBadge: {
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
  infoText: {
    flex: 1,
    justifyContent: 'center',
    gap: normalize(4),
  },
  title: {
    color: '#fff',
    fontSize: normalize(24),
    fontWeight: '700',
  },
  duration: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
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
  episodesContainer: {
    gap: normalize(16),
  },
  episodesTitle: {
    color: '#fff',
    fontSize: normalize(20),
    fontWeight: '700',
  },
  episodesList: {
    gap: normalize(12),
  },
  episodeCard: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: normalize(16),
    padding: normalize(16),
    gap: normalize(12),
    alignItems: 'center',
  },
  episodeCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  episodeNumber: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  episodeNumberText: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '700',
  },
  episodeInfo: {
    flex: 1,
    gap: normalize(4),
  },
  episodeTitle: {
    color: '#fff',
    fontSize: normalize(15),
    fontWeight: '600',
  },
  episodeDescription: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(13),
  },
  episodeMeta: {
    flexDirection: 'row',
    gap: normalize(8),
    marginTop: normalize(4),
  },
  episodeMetaText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(12),
  },
  episodePlayButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: normalize(8),
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

export default PodcastDetailScreen;

