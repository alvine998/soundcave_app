import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Share,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore: react-native-video lacks bundled types.
import Video from 'react-native-video';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import normalize from 'react-native-normalize';

import { COLORS } from '../../config/color';
import { getApiInstance } from '../../utils/api';
import { useToast } from '../../components/Toast';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
// Tab bar height: 60px base height + 10px marginTop from tabBarStyle
const TAB_BAR_BASE_HEIGHT = normalize(60) + normalize(10);

type CavelistData = {
  id: number;
  title: string;
  description: string;
  is_promotion: boolean;
  expiry_promotion: string | null;
  viewers: number;
  likes: number;
  shares: number;
  video_url: string;
  artist_id: number;
  artist_name: string;
  status: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const CavelistScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [videos, setVideos] = useState<CavelistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDownDistance, setPullDownDistance] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const videoRefs = useRef<{ [key: number]: any }>({});
  const scrollOffsetRef = useRef(0);
  const isScrollingRef = useRef(false);
  const lastScrollDirectionRef = useRef<'up' | 'down' | null>(null);
  const pullDownDistanceRef = useRef(0);
  const isInitialMountRef = useRef(true);
  const viewerTimersRef = useRef<{ [key: number]: ReturnType<typeof setTimeout> }>({});
  const viewerUpdatedRef = useRef<Set<number>>(new Set());

  // Fungsi untuk shuffle array secara random
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchVideos = useCallback(async (shuffle: boolean = false, isRefresh: boolean = false) => {
    try {
      // Only set loading if it's initial load, not refresh
      if (!isRefresh) {
        setLoading(true);
      }
      const api = await getApiInstance();
      const response = await api.get('/api/cavelists', {
        params: {
          page: 1,
          limit: 50, // Fetch more videos for smooth scrolling
        },
      });

      let data = response.data?.data || [];
      
      // Filter hanya yang status publish dan video_url ada
      data = data.filter((item: CavelistData) => 
        item.status === 'publish' && 
        item.video_url && 
        item.video_url.trim() !== '' &&
        !item.deleted_at
      );
      
      // Shuffle jika diminta
      if (shuffle && data.length > 0) {
        data = shuffleArray(data);
      }
      
      setVideos(data);
      
      // Reset viewer tracking untuk refresh
      if (isRefresh) {
        viewerUpdatedRef.current = new Set();
        // Clear all viewer timers
        Object.values(viewerTimersRef.current).forEach(timer => {
          if (timer) {
            clearTimeout(timer);
          }
        });
        viewerTimersRef.current = {};
      }
      
      // Reset ke index 0 setelah refresh
      setCurrentIndex(0);
      setIsPlaying(true);
      
      // Scroll ke top
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: 0, animated: false });
      }, 100);
    } catch (error: any) {
      console.error('Error fetching cavelists:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Gagal memuat cavelist';
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  // Function untuk update cavelist via PUT API
  const updateCavelist = useCallback(async (
    id: number,
    updates: { likes?: number; viewers?: number; shares?: number }
  ) => {
    try {
      const api = await getApiInstance();
      await api.put(`/api/cavelists/${id}`, updates);
    } catch (error: any) {
      console.error(`Error updating cavelist ${id}:`, error);
      // Don't show toast for update errors to avoid spam
    }
  }, []);

  // Function untuk track viewers setelah 3 detik
  const trackViewer = useCallback((videoId: number) => {
    // Clear existing timer jika ada
    if (viewerTimersRef.current[videoId]) {
      clearTimeout(viewerTimersRef.current[videoId]);
    }

    // Skip jika sudah pernah update viewers untuk video ini
    if (viewerUpdatedRef.current.has(videoId)) {
      return;
    }

    // Set timer untuk 3 detik
    viewerTimersRef.current[videoId] = setTimeout(() => {
      // Update viewers di local state
      setVideos(prev => prev.map(video => {
        if (video.id === videoId) {
          const newViewers = (video.viewers || 0) + 1;
          // Update via API
          updateCavelist(videoId, { viewers: newViewers });
          // Mark as updated
          viewerUpdatedRef.current.add(videoId);
          return { ...video, viewers: newViewers };
        }
        return video;
      }));
    }, 3000);
  }, [updateCavelist]);

  useEffect(() => {
    fetchVideos(false, false); // Initial load
    // Set initial mount to false after first load
    setTimeout(() => {
      isInitialMountRef.current = false;
    }, 100);
  }, [fetchVideos]);

  // Track viewer untuk video pertama saat mount
  useEffect(() => {
    if (videos.length > 0 && currentIndex === 0) {
      const firstVideo = videos[0];
      if (firstVideo) {
        trackViewer(firstVideo.id);
      }
    }
  }, [videos, currentIndex, trackViewer]);

  // Cleanup timers saat unmount
  useEffect(() => {
    return () => {
      Object.values(viewerTimersRef.current).forEach(timer => {
        if (timer) {
          clearTimeout(timer);
        }
      });
    };
  }, []);

  // Handle screen focus/unfocus
  useFocusEffect(
    useCallback(() => {
      // Screen focused - refresh videos dan reset ke index 0 jika bukan initial mount
      if (!isInitialMountRef.current) {
        setIsRefreshing(true);
        fetchVideos(true, true); // Refresh dengan shuffle, isRefresh = true
      }
      
      return () => {
        // Screen unfocused - pause semua video dan clear timers
        Object.values(videoRefs.current).forEach((video) => {
          if (video) {
            try {
              video.pause();
            } catch (error) {
              // Ignore errors if video is already released
            }
          }
        });
        // Clear all viewer timers
        Object.values(viewerTimersRef.current).forEach(timer => {
          if (timer) {
            clearTimeout(timer);
          }
        });
        viewerTimersRef.current = {};
        viewerUpdatedRef.current = new Set(); // Reset viewer tracking
        setIsPlaying(false);
        setCurrentIndex(0);
        setPullDownDistance(0);
        pullDownDistanceRef.current = 0;
      };
    }, [fetchVideos])
  );

  const currentIndexRef = useRef(currentIndex);
  const videosRef = useRef(videos);
  const isPlayingRef = useRef(isPlaying);

  // Update refs ketika state berubah
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      const currentIdx = currentIndexRef.current;
      const currentVideos = videosRef.current;
      
      if (newIndex !== null && newIndex !== undefined && newIndex !== currentIdx) {
        // Clear timer untuk previous video
        const previousVideo = currentVideos[currentIdx];
        if (previousVideo && viewerTimersRef.current[previousVideo.id]) {
          clearTimeout(viewerTimersRef.current[previousVideo.id]);
          delete viewerTimersRef.current[previousVideo.id];
        }

        // Pause previous video
        if (videoRefs.current[currentIdx]) {
          videoRefs.current[currentIdx]?.pause();
        }
        
        // Play new video
        setCurrentIndex(newIndex);
        setIsPlaying(true);
        
        // Track viewer untuk video baru
        const newVideo = currentVideos[newIndex];
        if (newVideo) {
          trackViewer(newVideo.id);
        }
        
        // Small delay to ensure video is ready
        setTimeout(() => {
          if (videoRefs.current[newIndex]) {
            videoRefs.current[newIndex]?.resume();
          }
        }, 100);
      }
    }
  }, [trackViewer]);

  const handleRefresh = useCallback(() => {
    if (!isRefreshing && currentIndex === 0) {
      setIsRefreshing(true);
      fetchVideos(true, true); // Refresh dengan shuffle, isRefresh = true
    }
  }, [currentIndex, isRefreshing, fetchVideos]);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const previousOffset = scrollOffsetRef.current;
    
    // Deteksi arah scroll dan pull down distance
    if (currentIndex === 0) {
      // Deteksi pull down: offsetY negatif berarti user pull down
      if (offsetY < 0) {
        lastScrollDirectionRef.current = 'down';
        const distance = Math.abs(offsetY);
        pullDownDistanceRef.current = distance;
        setPullDownDistance(distance);
        
        // Trigger refresh jika pull down cukup jauh (threshold: 100px)
        if (distance > 100 && !isRefreshing) {
          setIsRefreshing(true);
          fetchVideos(true, true); // Refresh dengan shuffle, isRefresh = true
          pullDownDistanceRef.current = 0;
          setPullDownDistance(0);
        }
      } else if (offsetY >= 0) {
        // Scroll kembali ke posisi normal atau scroll up
        lastScrollDirectionRef.current = offsetY > previousOffset ? 'up' : null;
        if (offsetY === 0) {
          pullDownDistanceRef.current = 0;
          setPullDownDistance(0);
        }
      }
    } else {
      pullDownDistanceRef.current = 0;
      setPullDownDistance(0);
      lastScrollDirectionRef.current = null;
    }
    
    scrollOffsetRef.current = offsetY;
  }, [currentIndex, isRefreshing, fetchVideos]);

  const handleScrollBeginDrag = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollOffsetRef.current = offsetY;
    isScrollingRef.current = true;
    if (currentIndex !== 0) {
      pullDownDistanceRef.current = 0;
      setPullDownDistance(0);
      lastScrollDirectionRef.current = null;
    }
  }, [currentIndex]);

  const handleScrollEndDrag = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    
    // Deteksi pull down dari index 0 setelah drag selesai
    if (
      currentIndex === 0 && 
      pullDownDistanceRef.current > 80 && 
      lastScrollDirectionRef.current === 'down' &&
      !isRefreshing
    ) {
      setIsRefreshing(true);
      fetchVideos(true, true); // Refresh dengan shuffle, isRefresh = true
    }
    
    // Reset pull down distance jika tidak cukup untuk trigger refresh
    if (pullDownDistanceRef.current <= 80) {
      pullDownDistanceRef.current = 0;
      setPullDownDistance(0);
    }
    
    scrollOffsetRef.current = offsetY;
    isScrollingRef.current = false;
  }, [currentIndex, isRefreshing, fetchVideos]);

  const handleMomentumScrollEnd = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    
    // Reset pull down distance setelah momentum scroll selesai
    if (offsetY >= 0) {
      pullDownDistanceRef.current = 0;
      setPullDownDistance(0);
    }
    
    scrollOffsetRef.current = offsetY;
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleVideoLoad = useCallback((index: number) => {
    // Use ref to get current values to avoid stale closure
    if (index === currentIndexRef.current && isPlayingRef.current) {
      setTimeout(() => {
        videoRefs.current[index]?.resume();
      }, 100);
    }
  }, []);

  const handleVideoError = (index: number, error: any) => {
    console.error(`Cavelist video error at index ${index}:`, error);
    showToast({
      message: 'Gagal memuat video',
      type: 'error',
    });
  };

  const togglePlayPause = useCallback(() => {
    const currentIdx = currentIndexRef.current;
    const playing = isPlayingRef.current;
    const video = videoRefs.current[currentIdx];
    if (video) {
      if (playing) {
        video.pause();
        setIsPlaying(false);
      } else {
        video.resume();
        setIsPlaying(true);
      }
    }
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  }, []);

  const handleLike = useCallback(async (videoId: number) => {
    const isLiked = likedVideos.has(videoId);
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    // Update local state immediately
    setLikedVideos(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });

    // Update likes count in local state
    setVideos(prev => prev.map(v => {
      if (v.id === videoId) {
        const newLikes = isLiked ? (v.likes || 0) - 1 : (v.likes || 0) + 1;
        // Update via API
        updateCavelist(videoId, { likes: newLikes });
        return { ...v, likes: newLikes };
      }
      return v;
    }));
  }, [likedVideos, videos, updateCavelist]);

  const handleShare = useCallback(async (video: CavelistData) => {
    try {
      const shareMessage = `${video.title} by ${video.artist_name}\n${video.description || ''}\n\nCheck out this video on SoundCave!`;
      
      const result = await Share.share({
        message: shareMessage,
        title: video.title,
      });

      // Jika share berhasil (user memilih platform), update shares count
      if (result.action === Share.sharedAction) {
        setVideos(prev => prev.map(v => {
          if (v.id === video.id) {
            const newShares = (v.shares || 0) + 1;
            // Update via API
            updateCavelist(video.id, { shares: newShares });
            return { ...v, shares: newShares };
          }
          return v;
        }));
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Gagal membagikan video');
    }
  }, [updateCavelist]);

  const renderVideoItem = ({ item, index }: { item: CavelistData; index: number }) => {
    const isCurrentVideo = index === currentIndex;
    const hasVideoUrl = item.video_url && item.video_url.trim() !== '';

    return (
      <View style={[styles.videoContainer, { height: VIDEO_HEIGHT }]}>
        {hasVideoUrl ? (
          <Video
            ref={(ref) => {
              videoRefs.current[index] = ref;
            }}
            source={{ uri: item.video_url }}
            style={styles.video}
            resizeMode="cover"
            paused={!isCurrentVideo || !isPlaying}
            repeat={true}
            onLoad={() => handleVideoLoad(index)}
            onError={(error) => handleVideoError(index, error)}
            muted={false}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
            allowsExternalPlayback={false}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Video tidak tersedia</Text>
          </View>
        )}

        {/* Overlay dengan informasi video */}
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={togglePlayPause}
        >
          {/* Controls overlay - di tengah saat tap */}
          {showControls && (
            <View style={styles.controlsOverlay}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={togglePlayPause}
              >
                <FontAwesome6
                  name={isPlaying ? 'pause' : 'play'}
                  size={30}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Video info di bagian bawah - seperti TikTok/Reels */}
          <View style={[styles.bottomOverlay, { paddingBottom: normalize(100) + insets.bottom }]}>
            <View style={styles.videoInfoLeft}>
              <Text style={styles.artistName}>{item.artist_name}</Text>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            <View style={styles.videoInfoRight}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleLike(item.id)}
              >
                <View style={styles.actionIconContainer}>
                  <FontAwesome6 
                    name="heart" 
                    size={28} 
                    color={likedVideos.has(item.id) ? COLORS.primary : "#fff"}
                    solid={likedVideos.has(item.id)}
                  />
                </View>
                <Text style={styles.actionText}>{item.likes || 0}</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionIconContainer}>
                  <FontAwesome6 name="comment" size={28} color="#fff" />
                </View>
                <Text style={styles.actionText}>0</Text>
              </TouchableOpacity> */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleShare(item)}
              >
                <View style={styles.actionIconContainer}>
                  <FontAwesome6 name="share" size={28} color="#fff" />
                </View>
                <Text style={styles.actionText}>{item.shares || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading && videos.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat video...</Text>
        </View>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tidak ada video</Text>
        </View>
      </View>
    );
  }

  // Calculate video height: full screen minus top inset (handled by paddingTop) and bottom tabs
  // Container already has paddingTop: insets.top, so FlatList content area is SCREEN_HEIGHT - insets.top
  // We need to subtract bottom tabs height: TAB_BAR_BASE_HEIGHT + insets.bottom (for safe area)
  const tabBarTotalHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;
  const VIDEO_HEIGHT = SCREEN_HEIGHT - insets.top - tabBarTotalHeight;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => String(item.id)}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={VIDEO_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        bounces={currentIndex === 0}
        alwaysBounceVertical={currentIndex === 0}
        bouncesZoom={false}
        overScrollMode="always"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: VIDEO_HEIGHT,
          offset: VIDEO_HEIGHT * index,
          index,
        })}
        initialScrollIndex={0}
      />
      {/* Pull to refresh indicator */}
      {currentIndex === 0 && pullDownDistance > 0 && pullDownDistance < 100 && !isRefreshing && (
        <View style={[styles.refreshIndicator, { opacity: Math.min(pullDownDistance / 100, 1) }]}>
          <Text style={styles.refreshText}>
            {pullDownDistance >= 80 ? 'Release to refresh' : 'Pull down to refresh'}
          </Text>
        </View>
      )}
      {isRefreshing && (
        <View style={styles.refreshIndicator} pointerEvents="none">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.refreshText}>Refreshing...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: normalize(16),
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(16),
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(16),
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(30),
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: normalize(16),
  },
  videoInfoLeft: {
    flex: 1,
    marginRight: normalize(16),
    paddingBottom: normalize(8),
  },
  artistName: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
    marginBottom: normalize(6),
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  videoTitle: {
    color: '#fff',
    fontSize: normalize(14),
    fontWeight: '400',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  videoInfoRight: {
    alignItems: 'center',
    gap: normalize(24),
    paddingBottom: normalize(8),
  },
  actionButton: {
    alignItems: 'center',
    gap: normalize(6),
  },
  actionIconContainer: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: normalize(12),
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  refreshIndicator: {
    position: 'absolute',
    top: normalize(100),
    left: normalize(20),
    right: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    gap: normalize(12),
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(20),
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: normalize(12),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  refreshText: {
    color: '#fff',
    fontSize: normalize(12),
    fontWeight: '600',
  },
});

export default CavelistScreen;
