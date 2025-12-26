import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import normalize from 'react-native-normalize';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../../config/color';
import { useToast } from '../../components/Toast';
import { getApiInstance } from '../../utils/api';
import { usePlayer } from '../../components/Player';
import { Song } from '../../storage/songs';

const FALLBACK_SONG_COVER =
  'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg?auto=compress&cs=tinysrgb&w=800';

type RootStackParamList = {
  MusicGenre: {
    genre: string;
  };
};

type MusicGenreRouteProp = RouteProp<RootStackParamList, 'MusicGenre'>;
type MusicGenreNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MusicGenre'
>;

const MusicGenreScreen: React.FC = () => {
  const navigation = useNavigation<MusicGenreNavigationProp>();
  const route = useRoute<MusicGenreRouteProp>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { playSong, currentSong, isPlaying } = usePlayer();

  const { genre } = route.params;

  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Fungsi untuk mapping data dari API ke struktur Song
  const mapApiDataToSong = useCallback((apiData: any): Song => {
    return {
      artist: apiData.artist || apiData.artist_name || 'Unknown Artist',
      title: apiData.title || apiData.name || 'Unknown Title',
      url: apiData.url || apiData.audio_file_url || apiData.audio || '',
      time: apiData.time || apiData.duration || apiData.length || '00:00',
      cover: apiData.cover || apiData.cover_image_url || apiData.image_url || apiData.image || apiData.cover_image || FALLBACK_SONG_COVER,
      lyrics: apiData.lyrics || '',
    };
  }, []);

  // Memoize fetchSongs dengan dependency yang benar
  const fetchSongsMemoized = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    if (!genre || !genre.trim()) {
      console.warn('Genre is empty, cannot fetch songs');
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      return;
    }

    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const api = await getApiInstance();
      const response = await api.get('/api/musics', {
        params: {
          page: pageNum,
          limit: 10,
          genre: genre.trim(),
        },
      });

      // Handle berbagai format response API
      const data = response.data?.data || response.data || [];
      const pagination = response.data?.pagination || {};

      // Map data dari API ke struktur Song
      const mappedSongs: Song[] = Array.isArray(data)
        ? data.map(mapApiDataToSong)
        : [];

      if (reset || pageNum === 1) {
        setSongs(mappedSongs);
      } else {
        setSongs(prev => [...prev, ...mappedSongs]);
      }

      setTotalPages(pagination.pages || 1);
      setHasMore(pageNum < (pagination.pages || 1));
      setPage(pageNum);
    } catch (error: any) {
      console.error('Error fetching songs by genre:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Gagal memuat music';
      showToast({
        message: errorMessage,
        type: 'error',
      });
      if (pageNum === 1) {
        setSongs([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [genre, mapApiDataToSong, showToast]);

  useEffect(() => {
    // Reset state ketika genre berubah
    setPage(1);
    setHasMore(true);
    setTotalPages(1);
    setSongs([]);
    fetchSongsMemoized(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchSongsMemoized(page + 1, false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSongsMemoized(1, true);
  }, [fetchSongsMemoized]);

  const renderSongItem = ({ item }: { item: Song }) => {
    const isActive = currentSong?.url === item.url && isPlaying;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.songRow, isActive && styles.songRowActive]}
        onPress={() => {
          playSong(item, songs);
          showToast({
            message: `Memutar ${item.title}`,
            type: 'info',
          });
        }}
      >
        <Image
          source={{ uri: item.cover }}
          style={styles.songCover}
          resizeMode="cover"
        />
        <View style={styles.songMeta}>
          <Text style={styles.songTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.songArtist} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
        <Text
          style={[
            styles.songDuration,
            isActive && styles.songDurationActive,
          ]}
        >
          {isActive ? 'Playing' : item.time}
        </Text>
      </TouchableOpacity>
    );
  };

  const paddingTop = Math.max(insets.top, normalize(24));
  const paddingBottom = Math.max(insets.bottom, normalize(16)) + normalize(100);

  if (loading && songs.length === 0) {
    return (
      <SafeAreaView style={[styles.safeArea, { paddingTop }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}>
            <FontAwesome6 name="chevron-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{genre}</Text>
          {/* <View style={styles.backButton} /> */}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat music...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}>
          <FontAwesome6 name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{genre}</Text>
        {/* <View style={styles.backButton} /> */}
      </View>
      <FlatList
        data={songs}
        keyExtractor={(item, index) => item.url || `song-${index}`}
        contentContainerStyle={[styles.songList, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
        renderItem={renderSongItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingMoreText}>Memuat lebih banyak...</Text>
            </View>
          ) : !hasMore && songs.length > 0 ? (
            <View style={styles.endContainer}>
              <Text style={styles.endText}>Tidak ada music lagi</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Tidak ada music untuk genre "{genre}"
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.purple,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(10),
    gap: normalize(12),
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: normalize(20),
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(16),
    paddingVertical: normalize(40),
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
  },
  songList: {
    paddingHorizontal: normalize(24),
    gap: normalize(12),
    paddingTop: normalize(8),
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: normalize(16),
    gap: normalize(12),
    padding: normalize(8),
  },
  songRowActive: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  songCover: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: 12,
    backgroundColor: '#222',
  },
  songMeta: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: normalize(15),
  },
  songArtist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(13),
    marginTop: normalize(2),
  },
  songDuration: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(13),
  },
  songDurationActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(12),
    paddingVertical: normalize(20),
  },
  loadingMoreText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
  },
  endContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(20),
  },
  endText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(14),
    fontStyle: 'italic',
  },
  emptyContainer: {
    paddingVertical: normalize(60),
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(16),
    textAlign: 'center',
  },
});

export default MusicGenreScreen;
