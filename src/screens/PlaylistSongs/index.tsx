import React, { useState, useEffect, useCallback } from 'react';
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
  PlaylistSongs: {
    playlistId: number;
    playlistName?: string;
    playlistCover?: string;
  };
};

type PlaylistSongsRouteProp = RouteProp<RootStackParamList, 'PlaylistSongs'>;
type PlaylistSongsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PlaylistSongs'
>;

type PlaylistSongItem = {
  id: number;
  playlist_id: number;
  music_id: number;
  position: number;
  music: {
    id: number;
    title: string;
    artist: string;
    duration: string;
    audio_file_url: string;
    cover_image_url: string;
    [key: string]: any;
  };
  playlist: {
    id: number;
    name: string;
    description: string;
    cover_image: string | null;
    [key: string]: any;
  };
};

const PlaylistSongsScreen: React.FC = () => {
  const navigation = useNavigation<PlaylistSongsNavigationProp>();
  const route = useRoute<PlaylistSongsRouteProp>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { playSong, currentSong, isPlaying } = usePlayer();

  const { playlistId, playlistName, playlistCover } = route.params;

  const [songs, setSongs] = useState<Song[]>([]);
  const [playlistData, setPlaylistData] = useState<{
    name: string;
    description: string;
    cover_image: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fungsi untuk mapping data dari API ke struktur Song
  const mapApiDataToSong = useCallback((apiData: any): Song => {
    return {
      artist: apiData.artist || apiData.artist_name || 'Unknown Artist',
      title: apiData.title || apiData.name || 'Unknown Title',
      url:
        apiData.url ||
        apiData.audio_file_url ||
        apiData.audio_url ||
        apiData.audio ||
        '',
      time: apiData.time || apiData.duration || apiData.length || '00:00',
      cover:
        apiData.cover ||
        apiData.cover_image_url ||
        apiData.image_url ||
        apiData.image ||
        apiData.cover_image ||
        FALLBACK_SONG_COVER,
      lyrics: apiData.lyrics || '',
    };
  }, []);

  const fetchPlaylistSongs = useCallback(async () => {
    try {
      setLoading(true);
      const api = await getApiInstance();

      // Try multiple endpoint options
      let response;
      let data;

      try {
        // Option 1: /api/playlists/{id}/songs
        response = await api.get(`/api/playlists/${playlistId}/songs`);
        data = response.data?.data || response.data || [];
      } catch (error: any) {
        // If endpoint doesn't exist, try alternative endpoints
        if (error.response?.status === 404) {
          try {
            // Option 2: /api/playlist-songs?playlist_id={id}
            response = await api.get(
              `/api/playlist-songs/playlist/${playlistId}`,
            );
            data = response.data?.data || response.data || [];
          } catch (error2: any) {
            // Option 3: Try /api/playlist-songs/{id} where id is playlist_id
            // This might return array or single item
            response = await api.get(`/api/playlist-songs/${playlistId}`);
            data = response.data?.data || response.data || [];
          }
        } else {
          throw error;
        }
      }

      // Handle response - could be array or single item
      if (!Array.isArray(data)) {
        // If single item, wrap it in array
        data = [data];
      }

      // If data is array of playlist-song items
      if (Array.isArray(data) && data.length > 0) {
        // Extract playlist info from first item if available
        if (data[0]?.playlist) {
          setPlaylistData({
            name: data[0].playlist.name,
            description: data[0].playlist.description || '',
            cover_image: data[0].playlist.cover_image,
          });
        }

        // Map playlist-song items to songs, sorted by position
        const sortedData = [...data].sort(
          (a, b) => (a.position || 0) - (b.position || 0),
        );
        const mappedSongs: Song[] = sortedData
          .map((item: PlaylistSongItem) => {
            if (item.music) {
              return mapApiDataToSong(item.music);
            }
            return null;
          })
          .filter((song): song is Song => song !== null);

        setSongs(mappedSongs);
      } else {
        // If no data
        setSongs([]);
      }
    } catch (error: any) {
      console.error('Error fetching playlist songs:', error);

      let errorMessage = 'Gagal memuat playlist songs';
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        errorMessage =
          'Koneksi timeout atau tidak stabil. Pastikan koneksi internet aktif.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (error.code !== 'ECONNABORTED' && error.message !== 'Network Error') {
        showToast({
          message: errorMessage,
          type: 'error',
        });
      }
      setSongs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [playlistId, mapApiDataToSong, showToast]);

  useEffect(() => {
    fetchPlaylistSongs();
  }, [fetchPlaylistSongs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlaylistSongs();
  }, [fetchPlaylistSongs]);

  const displayName = playlistName || playlistData?.name || 'Playlist';
  const displayCover = playlistCover || playlistData?.cover_image || null;

  const renderSongItem = ({ item, index }: { item: Song; index: number }) => {
    const isActive = currentSong?.url === item.url && isPlaying;

    return (
      <TouchableOpacity
        style={[styles.songRow, isActive && styles.songRowActive]}
        activeOpacity={0.85}
        onPress={() => {
          playSong(item);
          showToast({
            message: `Playing ${item.title}`,
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
          style={[styles.songDuration, isActive && styles.songDurationActive]}
        >
          {isActive ? 'Playing' : item.time}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome6 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {displayName}
        </Text>
        <View style={styles.backButton} />
      </View>

      {displayCover && (
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: displayCover }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        </View>
      )}

      {playlistData?.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{playlistData.description}</Text>
        </View>
      )}

      {loading && songs.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat songs...</Text>
        </View>
      ) : songs.length > 0 ? (
        <FlatList
          data={songs}
          renderItem={renderSongItem}
          keyExtractor={(item, index) => item.url || `song-${index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + normalize(100) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
              colors={['#ffffff']}
              progressBackgroundColor={COLORS.purple}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tidak ada songs dalam playlist</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.purple,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(16),
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: normalize(18),
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: normalize(12),
  },
  coverContainer: {
    alignItems: 'center',
    marginTop: normalize(20),
    marginBottom: normalize(16),
  },
  coverImage: {
    width: normalize(200),
    height: normalize(200),
    borderRadius: normalize(16),
    backgroundColor: '#222',
  },
  descriptionContainer: {
    paddingHorizontal: normalize(20),
    marginBottom: normalize(16),
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
    lineHeight: normalize(20),
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: normalize(20),
    gap: normalize(12),
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: normalize(16),
    gap: normalize(12),
    paddingVertical: normalize(8),
  },
  songRowActive: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    paddingHorizontal: normalize(8),
  },
  songCover: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: normalize(12),
    backgroundColor: '#222',
  },
  songMeta: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: normalize(14),
  },
  songArtist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
    marginTop: normalize(2),
  },
  songDuration: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(12),
  },
  songDurationActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(12),
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(14),
    fontStyle: 'italic',
  },
});

export default PlaylistSongsScreen;
