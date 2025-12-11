import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  FlatList,
  ImageBackground,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import normalize from 'react-native-normalize';

import { COLORS } from '../../config/color';
import { useToast } from '../../components/Toast';
import { getApiInstance } from '../../utils/api';
import { usePlayer } from '../../components/Player';
import { Song } from '../../storage/songs';
import { HomeTabParamList } from '../../navigation/HomeTabs';

type RootStackParamList = {
  MusicGenre: {
    genre: string;
  };
};

type SearchScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<HomeTabParamList, 'Search'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const FALLBACK_SONG_COVER =
  'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg?auto=compress&cs=tinysrgb&w=800';

type Genre = {
  id: string;
  name: string;
  image?: string;
  color?: string;
};

const SearchScreen = () => {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const [query, setQuery] = useState('');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const { showToast } = useToast();
  const { playSong, currentSong, isPlaying } = usePlayer();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchGenres();
  }, []);

  // Fungsi untuk mapping data dari API ke struktur Song
  const mapApiDataToSong = useCallback((apiData: any): Song => {
    return {
      artist: apiData.artist || apiData.artist_name || 'Unknown Artist',
      title: apiData.title || apiData.name || 'Unknown Title',
      url: apiData.url || apiData.audio_url || apiData.audio || '',
      time: apiData.time || apiData.duration || apiData.length || '00:00',
      cover: apiData.cover || apiData.image_url || apiData.image || apiData.cover_image || FALLBACK_SONG_COVER,
      lyrics: apiData.lyrics || '',
    };
  }, []);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      const api = await getApiInstance();
      const response = await api.get('/api/genres');
      setGenres(response.data.data || response.data || []);
    } catch (error: any) {
      console.error('Error fetching genres:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Gagal memuat genres';
      showToast({
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const searchMusic = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    try {
      setSearching(true);
      const api = await getApiInstance();
      const response = await api.get('/api/musics', {
        params: {
          page: 1,
          limit: 10,
          search: searchQuery.trim(),
        },
      });
      
      // Handle berbagai format response API
      const data = response.data?.data || response.data || [];
      
      // Map data dari API ke struktur Song
      const mappedSongs: Song[] = Array.isArray(data)
        ? data.map(mapApiDataToSong)
        : [];
      
      setSearchResults(mappedSongs);
    } catch (error: any) {
      console.error('Error searching music:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Gagal mencari music';
      showToast({
        message: errorMessage,
        type: 'error',
      });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [mapApiDataToSong, showToast]);

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchMusic(query);
      }, 500);
    } else {
      setSearchResults([]);
      setSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, searchMusic]);

  const filteredGenres = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return genres;
    return genres.filter(genre => genre.name.toLowerCase().includes(q));
  }, [genres, query]);

  const paddingBottom = normalize(100);

  const renderSongItem = ({ item }: { item: Song }) => {
    const isActive = currentSong?.url === item.url && isPlaying;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.songRow, isActive && styles.songRowActive]}
        onPress={() => {
          playSong(item);
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

  const renderGenreItem = ({ item, index }: { item: Genre; index: number }) => {
    const isEven = index % 2 === 0;
    const genreColors = [
      '#ff6b6b',
      '#4ecdc4',
      '#45b7d1',
      '#f9ca24',
      '#6c5ce7',
      '#a29bfe',
      '#fd79a8',
      '#fdcb6e',
      '#e17055',
      '#00b894',
      '#0984e3',
      '#d63031',
    ];
    const bgColor = item.color || genreColors[index % genreColors.length];

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.genreCard,
          isEven && styles.genreCardLeft,
          !isEven && styles.genreCardRight,
        ]}
        onPress={() => {
          navigation.navigate('MusicGenre', { genre: item.name });
        }}>
        {item.image ? (
          <ImageBackground
            source={{ uri: item.image }}
            style={styles.genreCardBackground}
            imageStyle={styles.genreCardImage}>
            <View style={styles.genreCardOverlay} />
            <Text style={styles.genreCardText}>{item.name}</Text>
          </ImageBackground>
        ) : (
          <View style={[styles.genreCardBackground, { backgroundColor: bgColor }]}>
            <Text style={styles.genreCardText}>{item.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Search</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari music..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={query}
          onChangeText={setQuery}
        />

        {query.trim() ? (
          // Show search results
          searching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Mencari music...</Text>
            </View>
          ) : (
            <FlatList
              key="search-results"
              data={searchResults}
              keyExtractor={(item, index) => item.url || `song-${index}`}
              contentContainerStyle={[styles.songList, { paddingBottom }]}
              showsVerticalScrollIndicator={false}
              renderItem={renderSongItem}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    Tidak ada music ditemukan untuk "{query}"
                  </Text>
                </View>
              }
            />
          )
        ) : (
          // Show genres when no search query
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              key="genres-list"
              data={filteredGenres}
              keyExtractor={item => item.id || item.name}
              numColumns={2}
              contentContainerStyle={[styles.genreGrid, { paddingBottom }]}
              showsVerticalScrollIndicator={false}
              renderItem={renderGenreItem}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Tidak ada genres</Text>
                </View>
              }
            />
          )
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.purple,
    paddingTop: normalize(24),
  },
  container: {
    flex: 1,
    padding: normalize(24),
    gap: normalize(16),
  },
  title: {
    fontSize: normalize(30),
    fontWeight: '700',
    color: '#fff',
  },
  searchInput: {
    borderRadius: normalize(999),
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(20),
    backgroundColor: '#111',
    color: '#fff',
    fontSize: normalize(16),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: normalize(100),
  },
  genreGrid: {
    gap: normalize(12),
    paddingTop: normalize(8),
  },
  genreCard: {
    flex: 1,
    height: normalize(100),
    borderRadius: normalize(8),
    overflow: 'hidden',
  },
  genreCardLeft: {
    marginRight: normalize(6),
  },
  genreCardRight: {
    marginLeft: normalize(6),
  },
  genreCardBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: normalize(16),
  },
  genreCardImage: {
    borderRadius: normalize(8),
  },
  genreCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: normalize(8),
  },
  genreCardText: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  emptyContainer: {
    paddingVertical: normalize(60),
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(16),
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
    marginTop: normalize(12),
  },
  songList: {
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
});

export default SearchScreen;