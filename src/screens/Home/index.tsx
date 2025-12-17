import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import normalize from 'react-native-normalize';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { HomeTabParamList } from '../../navigation/HomeTabs';

import { usePlayer } from '../../components/Player';
import { useToast } from '../../components/Toast';
import { COLORS } from '../../config/color';
import { UserProfile } from '../../storage/userStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SONGS, Song } from '../../storage/songs';
import { NEWS, NEWS_BACKDROPS } from '../../storage/news';
import { getApiInstance } from '../../utils/api';

type RootStackParamList = {
  Home: undefined;
  News: undefined;
  NewsDetail: {
    id: string;
  };
  MusicVideoDetail: {
    id: string;
    title: string;
    artist: string;
    cover: string;
    videoUrl?: string;
  };
  PodcastDetail: {
    id: string;
    title: string;
    duration: string;
    cover: string;
    audioUrl?: string;
  };
  PlaylistSongs: {
    playlistId: number;
    playlistName?: string;
    playlistCover?: string;
  };
  Profile: undefined;
};

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<HomeTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type HomeScreenProps = {
  profile: UserProfile;
  onLogout: () => void;
};

const MOCK_MIXES = [
  { id: 'mix-1', title: 'Sunset Loops', subtitle: 'Chill & Downtempo' },
  { id: 'mix-2', title: 'Pulse Runner', subtitle: 'Electronic Boost' },
  { id: 'mix-3', title: 'Soul Therapy', subtitle: 'Neo-soul vibes' },
];

const TOP_PLAYLISTS = [
  { id: 'tp-1', title: 'Hip Hop Heat', description: 'Daily rap essentials' },
  { id: 'tp-2', title: 'Indonesia Top 100', description: 'Chart toppers Indo' },
  { id: 'tp-3', title: 'US Top 100', description: 'Stateside anthems' },
  { id: 'tp-4', title: 'K-Pop Hits', description: 'Idol energy' },
  { id: 'tp-5', title: 'Rising Up', description: 'Emerging artists' },
  { id: 'tp-6', title: 'Indonesia Hits', description: 'Local legends' },
];

const CONTINUE_LISTENING = [
  { id: 'cl-1', title: 'Lofi Bloom', artist: 'NOVA', progress: 0.35 },
  { id: 'cl-2', title: 'Bass Therapy', artist: 'RAYON', progress: 0.6 },
  { id: 'cl-3', title: 'Fewture Bounce', artist: 'ECHO', progress: 0.12 },
];

const FEATURED_ARTISTS = [
  { id: 'artist-1', name: 'Luna Wave', color: '#ff7eb3' },
  { id: 'artist-2', name: 'Sonic Blu', color: '#70e1f5' },
  { id: 'artist-3', name: 'Golden Vox', color: '#ffd452' },
  { id: 'artist-4', name: 'Aria Moon', color: '#8e9eab' },
];

const FALLBACK_SONG_COVER =
  'https://images.pexels.com/photos/995301/pexels-photo-995301.jpeg?auto=compress&cs=tinysrgb&w=800';

const BestSongCoverImage: React.FC<{ uri: string }> = ({ uri }) => {
  const [failed, setFailed] = useState(false);

  return (
    <Image
      key={failed ? `fallback-${uri}` : uri}
      source={{ uri: failed ? FALLBACK_SONG_COVER : uri }}
      style={styles.bestSongCover}
      resizeMode="cover"
      onError={() => {
        if (!failed) {
          setFailed(true);
        }
      }}
    />
  );
};

type MusicVideo = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  videoUrl?: string;
};

type Podcast = {
  id: string;
  title: string;
  duration: string;
  cover: string;
  audioUrl?: string;
};

type NewsData = {
  id: number;
  title: string;
  content: string;
  summary: string;
  author: string;
  category: string;
  image_url: string;
  published_at: string | null;
  is_published: boolean;
  is_headline: boolean;
  views: number;
  tags: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const LIVE_SESSIONS = [
  { id: 'live-1', title: 'Night Swim Radio', listeners: '12K' },
  { id: 'live-2', title: 'Studio B Unplugged', listeners: '8.4K' },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ profile }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { showToast } = useToast();
  const { playSong, currentSong, isPlaying } = usePlayer();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery] = useState('');
  const [latestDrops, setLatestDrops] = useState<readonly Song[]>([]);
  const [loadingLatestDrops, setLoadingLatestDrops] = useState(true);
  const [musicVideos, setMusicVideos] = useState<MusicVideo[]>([]);
  const [loadingMusicVideos, setLoadingMusicVideos] = useState(true);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loadingPodcasts, setLoadingPodcasts] = useState(true);
  const [newsData, setNewsData] = useState<NewsData[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [topStreamedSongs, setTopStreamedSongs] = useState<readonly Song[]>([]);
  const [loadingTopStreamed, setLoadingTopStreamed] = useState(true);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Fungsi untuk mapping data dari API ke struktur Song
  const mapApiDataToSong = (apiData: any): Song => {
    return {
      artist: apiData.artist || apiData.artist_name || 'Unknown Artist',
      title: apiData.title || apiData.name || 'Unknown Title',
      url: apiData.url || apiData.audio_file_url || apiData.audio || '',
      time: apiData.time || apiData.duration || apiData.length || '00:00',
      cover: apiData.cover || apiData.cover_image_url || apiData.image || apiData.cover_image || FALLBACK_SONG_COVER,
      lyrics: apiData.lyrics || '',
    };
  };

  const fetchLatestDrops = useCallback(async () => {
    try {
      setLoadingLatestDrops(true);
      const api = await getApiInstance();
      const response = await api.get('/api/musics');
      
      // Handle berbagai format response API
      const data = response.data?.data || response.data || [];
      
      // Map data dari API ke struktur Song
      const mappedSongs: Song[] = Array.isArray(data)
        ? data.map(mapApiDataToSong)
        : [];
      
      setLatestDrops(mappedSongs);
    } catch (error: any) {
      console.error('Error fetching latest drops:', error);
      
      // Handle network errors dengan pesan yang lebih informatif
      let errorMessage = 'Gagal memuat latest drops';
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        errorMessage = 'Koneksi timeout atau tidak stabil. Pastikan koneksi internet aktif dan coba lagi.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast({
        message: errorMessage,
        type: 'error',
      });
      // Fallback ke SONGS jika error
      setLatestDrops([...SONGS]);
    } finally {
      setLoadingLatestDrops(false);
    }
  }, [showToast]);

  // Fungsi untuk mapping data dari API ke struktur MusicVideo
  const mapApiDataToMusicVideo = (apiData: any): MusicVideo => {
    return {
      id: String(apiData.id || ''),
      title: apiData.title || 'Unknown Title',
      artist: apiData.artist || 'Unknown Artist',
      cover: apiData.thumbnail || apiData.cover || FALLBACK_SONG_COVER,
      videoUrl: apiData.video_url || apiData.videoUrl || undefined,
    };
  };

  const fetchMusicVideos = useCallback(async () => {
    try {
      setLoadingMusicVideos(true);
      const api = await getApiInstance();
      const response = await api.get('/api/music-videos', {
        params: {
          page: 1,
          limit: 5,
        },
      });
      
      // Handle struktur response: { success, data: [...], pagination }
      const data = response.data?.data || [];
      
      // Map data dari API ke struktur MusicVideo
      const mappedVideos: MusicVideo[] = Array.isArray(data)
        ? data.map(mapApiDataToMusicVideo)
        : [];
      
      setMusicVideos(mappedVideos);
    } catch (error: any) {
      console.error('Error fetching music videos:', error);
      
      // Handle network errors dengan pesan yang lebih informatif
      let errorMessage = 'Gagal memuat music videos';
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        errorMessage = 'Koneksi timeout atau tidak stabil. Pastikan koneksi internet aktif.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Hanya tampilkan toast jika bukan network error (untuk menghindari spam)
      if (error.code !== 'ECONNABORTED' && error.message !== 'Network Error') {
        showToast({
          message: errorMessage,
          type: 'error',
        });
      }
      // Set empty array jika error
      setMusicVideos([]);
    } finally {
      setLoadingMusicVideos(false);
    }
  }, [showToast]);

  // Fungsi untuk mapping data dari API ke struktur Podcast
  const mapApiDataToPodcast = (apiData: any): Podcast => {
    // Format duration dari "42:15" ke "42 min" atau tetap seperti aslinya
    let formattedDuration = apiData.duration || '0:00';
    // Jika format seperti "42:15", ubah ke "42 min"
    if (formattedDuration.includes(':') && formattedDuration.split(':').length === 2) {
      const [minutes, seconds] = formattedDuration.split(':');
      const totalMinutes = parseInt(minutes, 10);
      formattedDuration = `${totalMinutes} min`;
    }
    
    return {
      id: String(apiData.id || ''),
      title: apiData.title || 'Unknown Title',
      duration: formattedDuration,
      cover: apiData.thumbnail || apiData.cover || FALLBACK_SONG_COVER,
      audioUrl: apiData.audio_url || apiData.audioUrl || apiData.video_url || undefined,
    };
  };

  const fetchPodcasts = useCallback(async () => {
    try {
      setLoadingPodcasts(true);
      const api = await getApiInstance();
      const response = await api.get('/api/podcasts', {
        params: {
          page: 1,
          limit: 5,
        },
      });
      
      // Handle struktur response: { success, data: [...], pagination }
      const data = response.data?.data || [];
      
      // Map data dari API ke struktur Podcast
      const mappedPodcasts: Podcast[] = Array.isArray(data)
        ? data.map(mapApiDataToPodcast)
        : [];
      
      setPodcasts(mappedPodcasts);
    } catch (error: any) {
      console.error('Error fetching podcasts:', error);
      
      // Handle network errors dengan pesan yang lebih informatif
      let errorMessage = 'Gagal memuat podcasts';
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        errorMessage = 'Koneksi timeout atau tidak stabil. Pastikan koneksi internet aktif.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Hanya tampilkan toast jika bukan network error (untuk menghindari spam)
      if (error.code !== 'ECONNABORTED' && error.message !== 'Network Error') {
        showToast({
          message: errorMessage,
          type: 'error',
        });
      }
      // Set empty array jika error
      setPodcasts([]);
    } finally {
      setLoadingPodcasts(false);
    }
  }, [showToast]);

  // Fungsi untuk mapping data dari API ke struktur NewsItem
  const mapApiDataToNewsItem = (apiData: NewsData, index: number) => {
    // Format date dari published_at atau created_at
    const dateString = apiData.published_at || apiData.created_at;
    let formattedDate = '';
    if (dateString) {
      try {
        const date = new Date(dateString);
        formattedDate = date.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        formattedDate = dateString;
      }
    }

    // Gunakan image_url dari API atau fallback ke NEWS_BACKDROPS
    const backdrop = apiData.image_url || NEWS_BACKDROPS[index % NEWS_BACKDROPS.length];

    return {
      id: String(apiData.id),
      title: apiData.title || 'Untitled',
      summary: apiData.summary || '',
      date: formattedDate,
      category: (apiData.category?.toLowerCase() as 'recommend' | 'popular' | 'new') || 'new',
      content: apiData.content || '',
      image_url: backdrop,
    };
  };

  const fetchNews = useCallback(async () => {
    try {
      setLoadingNews(true);
      const api = await getApiInstance();
      const response = await api.get('/api/news', {
        params: {
          page: 1,
          limit: 3,
        },
      });
      
      // Handle struktur response: { success, data: [...], pagination }
      const data = response.data?.data || [];
      
      // Filter hanya yang is_published = true
      const publishedNews = Array.isArray(data)
        ? data.filter((item: NewsData) => item.is_published !== false)
        : [];
      
      // Map data dari API ke struktur NewsData
      setNewsData(publishedNews);
    } catch (error: any) {
      console.error('Error fetching news:', error);
      
      // Handle network errors dengan pesan yang lebih informatif
      let errorMessage = 'Gagal memuat news';
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        errorMessage = 'Koneksi timeout atau tidak stabil. Pastikan koneksi internet aktif.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Hanya tampilkan toast jika bukan network error (untuk menghindari spam)
      if (error.code !== 'ECONNABORTED' && error.message !== 'Network Error') {
        showToast({
          message: errorMessage,
          type: 'error',
        });
      }
      // Set empty array jika error
      setNewsData([]);
    } finally {
      setLoadingNews(false);
    }
  }, [showToast]);

  const fetchTopStreamed = useCallback(async () => {
    try {
      setLoadingTopStreamed(true);
      const api = await getApiInstance();
      const response = await api.get('/api/musics/top-streamed');
      
      // Handle struktur response: { success, data: [...], count }
      const data = response.data?.data || [];
      
      // Map data dari API ke struktur Song
      const mappedSongs: Song[] = Array.isArray(data)
        ? data.map(mapApiDataToSong).filter(song => {
            // Filter out songs without valid URL
            return song.url && song.url.trim() !== '';
          })
        : [];
      
      setTopStreamedSongs(mappedSongs);
    } catch (error: any) {
      console.error('Error fetching top streamed:', error);
      
      // Handle network errors dengan pesan yang lebih informatif
      let errorMessage = 'Gagal memuat top streamed';
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        errorMessage = 'Koneksi timeout atau tidak stabil. Pastikan koneksi internet aktif.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Hanya tampilkan toast jika bukan network error (untuk menghindari spam)
      if (error.code !== 'ECONNABORTED' && error.message !== 'Network Error') {
        showToast({
          message: errorMessage,
          type: 'error',
        });
      }
      // Fallback ke SONGS jika error
      setTopStreamedSongs([...SONGS].slice(0, 5));
    } finally {
      setLoadingTopStreamed(false);
    }
  }, [showToast]);

  const fetchPlaylists = useCallback(async () => {
    try {
      setLoadingPlaylists(true);
      const api = await getApiInstance();
      const response = await api.get('/api/playlists', {
        params: {
          page: 1,
          limit: 10,
          is_public: true,
        },
      });
      
      // Handle struktur response: { success, data: [...], pagination }
      const data = response.data?.data || [];
      
      setPlaylists(data);
    } catch (error: any) {
      console.error('Error fetching playlists:', error);
      
      // Handle network errors dengan pesan yang lebih informatif
      let errorMessage = 'Gagal memuat playlists';
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        errorMessage = 'Koneksi timeout atau tidak stabil. Pastikan koneksi internet aktif.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Hanya tampilkan toast jika bukan network error (untuk menghindari spam)
      if (error.code !== 'ECONNABORTED' && error.message !== 'Network Error') {
        showToast({
          message: errorMessage,
          type: 'error',
        });
      }
      // Set empty array jika error
      setPlaylists([]);
    } finally {
      setLoadingPlaylists(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLatestDrops();
    fetchMusicVideos();
    fetchPodcasts();
    fetchNews();
    fetchTopStreamed();
    fetchPlaylists();
  }, [fetchLatestDrops, fetchMusicVideos, fetchPodcasts, fetchNews, fetchTopStreamed, fetchPlaylists]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchLatestDrops(), fetchMusicVideos(), fetchPodcasts(), fetchNews(), fetchTopStreamed(), fetchPlaylists()]).finally(() => {
      setRefreshing(false);
      showToast({ message: 'Home refreshed', type: 'info' });
    });
  }, [fetchLatestDrops, fetchMusicVideos, fetchPodcasts, fetchNews, fetchTopStreamed, fetchPlaylists, showToast]);

  const selectedGenres = profile.selectedGenres ?? [];
  const paddingTop = Math.max(insets.top, normalize(24));
  const paddingBottom = Math.max(insets.bottom, normalize(10)) + normalize(30);

  const filteredSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const songsToFilter = latestDrops.length > 0 ? latestDrops : SONGS;
    if (!query) {
      return songsToFilter;
    }
    return songsToFilter.filter(song => {
      return (
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, latestDrops]);

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop, paddingBottom }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ffffff"
            colors={['#ffffff']}
            progressBackgroundColor={COLORS.purple}
          />
        }
        contentContainerStyle={[styles.scrollContent, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.profileInfo}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Profile')}
                >
                  {profile.profile_image ? (
                    <Image
                      source={{ uri: profile.profile_image }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.profileImagePlaceholder}>
                      <Text style={styles.profileImageText}>
                        {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <View style={styles.profileTextContainer}>
                  <Text style={styles.greeting}>{greeting}</Text>
                  <Text style={styles.name}>
                    {profile.full_name || 'User'}
                  </Text>
                </View>
              </View>
            </View>
            <Image
              source={require('../../assets/images/home_soundcave.png')}
              style={{ width: normalize(100), height: normalize(50) }}
            />
          </View>
          {loadingTopStreamed && topStreamedSongs.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Memuat top streamed...</Text>
            </View>
          ) : topStreamedSongs.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bestSongsScrollContent}
            >
              {/* Song #1 (large) */}
              {topStreamedSongs.slice(0, 1).map(song => {
                const isActive = currentSong?.url === song.url && isPlaying;
                return (
                  <TouchableOpacity
                    key={song.url || `top-1`}
                    activeOpacity={0.85}
                    style={[
                      styles.bestSongCardLarge,
                      isActive && styles.bestSongCardActive,
                    ]}
                    onPress={() => {
                      if (!song.url || song.url.trim() === '') {
                        showToast({
                          message: `Audio tidak tersedia untuk ${song.title}`,
                          type: 'error',
                        });
                        return;
                      }
                      playSong(song);
                      showToast({
                        message: `Playing ${song.title}`,
                        type: 'info',
                      });
                    }}
                  >
                    <BestSongCoverImage uri={song.cover} />
                    <View style={styles.bestSongOverlay}>
                      <View style={styles.bestSongBadge}>
                        <Text style={styles.bestSongRank}>#1</Text>
                      </View>
                      <View style={styles.bestSongInfo}>
                        <Text style={styles.bestSongTitle} numberOfLines={1}>
                          {song.title}
                        </Text>
                        <Text style={styles.bestSongArtist} numberOfLines={1}>
                          {song.artist}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {/* Songs #2 and #3 (vertical column) */}
              <View style={styles.bestSongsVerticalColumn}>
                {topStreamedSongs.slice(1, 3).map((song, index) => {
                  const isActive = currentSong?.url === song.url && isPlaying;
                  const rank = index + 2;
                  return (
                    <TouchableOpacity
                      key={song.url || `top-${rank}`}
                      activeOpacity={0.85}
                      style={[
                        styles.bestSongCardSmall,
                        isActive && styles.bestSongCardActive,
                      ]}
                      onPress={() => {
                        playSong(song);
                        showToast({
                          message: `Playing ${song.title}`,
                          type: 'info',
                        });
                      }}
                    >
                      <BestSongCoverImage uri={song.cover} />
                      <View style={styles.bestSongOverlay}>
                        <View style={styles.bestSongBadge}>
                          <Text style={styles.bestSongRank}>#{rank}</Text>
                        </View>
                        <View style={styles.bestSongInfo}>
                          <Text style={styles.bestSongTitle} numberOfLines={1}>
                            {song.title}
                          </Text>
                          <Text style={styles.bestSongArtist} numberOfLines={1}>
                            {song.artist}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* Songs #4 and #5 (vertical column) */}
              <View style={styles.bestSongsVerticalColumn}>
                {topStreamedSongs.slice(3, 5).map((song, index) => {
                  const isActive = currentSong?.url === song.url && isPlaying;
                  const rank = index + 4;
                  return (
                    <TouchableOpacity
                      key={song.url || `top-${rank}`}
                      activeOpacity={0.85}
                      style={[
                        styles.bestSongCardSmall,
                        isActive && styles.bestSongCardActive,
                      ]}
                      onPress={() => {
                        playSong(song);
                        showToast({
                          message: `Playing ${song.title}`,
                          type: 'info',
                        });
                      }}
                    >
                      <BestSongCoverImage uri={song.cover} />
                      <View style={styles.bestSongOverlay}>
                        <View style={styles.bestSongBadge}>
                          <Text style={styles.bestSongRank}>#{rank}</Text>
                        </View>
                        <View style={styles.bestSongInfo}>
                          <Text style={styles.bestSongTitle} numberOfLines={1}>
                            {song.title}
                          </Text>
                          <Text style={styles.bestSongArtist} numberOfLines={1}>
                            {song.artist}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tidak ada top streamed</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your vibe</Text>
          {selectedGenres.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRowScrollContent}
            >
              {selectedGenres.map(genre => (
                <View key={genre} style={styles.genreChip}>
                  <Text style={styles.genreChipText}>{genre}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyGenres}>
              You haven't picked any genres yet.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Podcasts</Text>
          {loadingPodcasts && podcasts.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Memuat podcasts...</Text>
            </View>
          ) : podcasts.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.podcastScrollContent}
            >
              {podcasts.map(podcast => (
                <TouchableOpacity
                  key={podcast.id}
                  activeOpacity={0.85}
                  style={styles.podcastCard}
                  onPress={() => {
                    navigation.navigate('PodcastDetail', {
                      id: podcast.id,
                      title: podcast.title,
                      duration: podcast.duration,
                      cover: podcast.cover,
                      audioUrl: podcast.audioUrl,
                    });
                  }}
                >
                  <Image
                    source={{ uri: podcast.cover }}
                    style={styles.podcastCover}
                    resizeMode="cover"
                  />
                  <Text style={styles.podcastTitle} numberOfLines={2}>
                    {podcast.title}
                  </Text>
                  <Text style={styles.podcastDuration}>{podcast.duration}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tidak ada podcasts</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Music Video</Text>
          {loadingMusicVideos && musicVideos.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Memuat music videos...</Text>
            </View>
          ) : musicVideos.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.musicVideoScrollContent}
            >
              {musicVideos.map(video => (
                <TouchableOpacity
                  key={video.id}
                  activeOpacity={0.85}
                  style={styles.musicVideoCard}
                  onPress={() => {
                    navigation.navigate('MusicVideoDetail', {
                      id: video.id,
                      title: video.title,
                      artist: video.artist,
                      cover: video.cover,
                      videoUrl: video.videoUrl,
                    });
                  }}
                >
                  <Image
                    source={{ uri: video.cover }}
                    style={styles.musicVideoCover}
                    resizeMode="cover"
                  />
                  <Text style={styles.musicVideoTitle} numberOfLines={1}>
                    {video.title}
                  </Text>
                  <Text style={styles.musicVideoArtist} numberOfLines={1}>
                    {video.artist}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tidak ada music videos</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest drops</Text>
          {loadingLatestDrops && latestDrops.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Memuat latest drops...</Text>
            </View>
          ) : filteredSongs.length > 0 ? (
            <View style={styles.songList}>
              {filteredSongs.map((song, index) => {
                const isActive = currentSong?.url === song.url && isPlaying;
                return (
                  <TouchableOpacity
                    key={song.url || `song-${index}`}
                    activeOpacity={0.85}
                    style={[styles.songRow, isActive && styles.songRowActive]}
                    onPress={() => {
                      if (!song.url || song.url.trim() === '') {
                        showToast({
                          message: `Audio tidak tersedia untuk ${song.title}`,
                          type: 'error',
                        });
                        return;
                      }
                      playSong(song);
                      showToast({
                        message: `Playing ${song.title}`,
                        type: 'info',
                      });
                    }}
                  >
                    <Image
                      source={{ uri: song.cover }}
                      style={styles.songCover}
                    />
                    <View style={styles.songMeta}>
                      <Text style={styles.songTitle}>{song.title}</Text>
                      <Text style={styles.songArtist}>{song.artist}</Text>
                    </View>
                    <Text
                      style={[
                        styles.songDuration,
                        isActive && styles.songDurationActive,
                      ]}
                    >
                      {isActive ? 'Playing' : song.time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tidak ada latest drops</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fresh mixes</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {MOCK_MIXES.map(mix => (
              <TouchableOpacity
                key={mix.id}
                activeOpacity={0.85}
                style={styles.mixCard}
              >
                <Text style={styles.mixTitle}>{mix.title}</Text>
                <Text style={styles.mixSubtitle}>{mix.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top playlists</Text>
          {loadingPlaylists && playlists.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Memuat playlists...</Text>
            </View>
          ) : playlists.length > 0 ? (
            <View style={styles.playlistGrid}>
              {playlists.map(item => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  style={styles.playlistCard}
                  onPress={() => {
                    navigation.navigate('PlaylistSongs', {
                      playlistId: item.id,
                      playlistName: item.name,
                      playlistCover: item.cover_image || undefined,
                    });
                  }}
                >
                  {item.cover_image ? (
                    <Image
                      source={{ uri: item.cover_image }}
                      style={styles.playlistCoverImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.playlistCoverPlaceholder}>
                      <Text style={styles.playlistCoverText}>
                        {item.name?.charAt(0)?.toUpperCase() || 'P'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.playlistTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.playlistSubtitle} numberOfLines={2}>
                    {item.description || 'No description'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tidak ada playlists</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue listening</Text>
          <View style={styles.verticalStack}>
            {CONTINUE_LISTENING.map(mix => (
              <View key={mix.id} style={styles.continueCard}>
                <View style={styles.continueMeta}>
                  <Text style={styles.continueTitle}>{mix.title}</Text>
                  <Text style={styles.continueArtist}>{mix.artist}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${mix.progress * 100}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured artists</Text>
          <View style={styles.artistRow}>
            {FEATURED_ARTISTS.map(artist => (
              <View key={artist.id} style={styles.artistItem}>
                <View
                  style={[
                    styles.artistAvatar,
                    { backgroundColor: artist.color },
                  ]}
                />
                <Text style={styles.artistName}>{artist.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live sessions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {LIVE_SESSIONS.map(session => (
              <View key={session.id} style={styles.liveCard}>
                <Text style={styles.liveLabel}>LIVE</Text>
                <Text style={styles.liveTitle}>{session.title}</Text>
                <Text style={styles.liveListeners}>
                  {session.listeners} listeners
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>News</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('News')}
            >
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          {loadingNews && newsData.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Memuat news...</Text>
            </View>
          ) : newsData.length > 0 ? (
            <View style={styles.newsList}>
              {newsData.map((item, index) => {
                const mappedNews = mapApiDataToNewsItem(item, index);
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate('NewsDetail', {
                        id: mappedNews.id,
                      })
                    }
                  >
                    <ImageBackground
                      source={{ uri: mappedNews.image_url }}
                      style={styles.newsCard}
                      imageStyle={styles.newsCardBackgroundImage}
                    >
                      <View style={styles.newsCardOverlay} />
                      <View style={styles.newsCardContent}>
                        <View style={styles.newsMetaRow}>
                          <Text style={styles.newsDate}>{mappedNews.date}</Text>
                        </View>
                        <Text style={styles.newsTitle} numberOfLines={2}>
                          {mappedNews.title}
                        </Text>
                        <Text style={styles.newsSummary} numberOfLines={2}>
                          {mappedNews.summary}
                        </Text>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tidak ada news</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.purple,
  },
  scrollContent: {
    paddingHorizontal: normalize(24),
    gap: normalize(28),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: normalize(14),
  },
  headerLeft: {
    flex: 1,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
  },
  profileImage: {
    width: normalize(50),
    height: normalize(50),
    borderRadius: normalize(25),
    backgroundColor: '#222',
  },
  profileImagePlaceholder: {
    width: normalize(50),
    height: normalize(50),
    borderRadius: normalize(25),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    color: '#fff',
    fontSize: normalize(20),
    fontWeight: '700',
  },
  profileTextContainer: {
    flex: 1,
    gap: normalize(2),
  },
  greeting: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(14),
  },
  name: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: '#fff',
  },
  email: {
    fontSize: normalize(12),
    color: 'rgba(255,255,255,0.5)',
    marginTop: normalize(2),
  },
  logoutButton: {
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(12),
    borderRadius: normalize(999),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
  bestSongsScrollContent: {
    gap: normalize(10),
    paddingRight: normalize(24),
  },
  bestSongsVerticalColumn: {
    flexDirection: 'column',
    gap: normalize(10),
  },
  bestSongCardSmall: {
    width: normalize(95),
    height: normalize(95),
    borderRadius: normalize(10),
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
  },
  bestSongCardLarge: {
    width: normalize(200),
    height: normalize(200),
    borderRadius: normalize(10),
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
  },
  bestSongCardActive: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  bestSongCover: {
    width: '100%',
    height: '100%',
    backgroundColor: '#222',
  },
  bestSongOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: normalize(16),
    justifyContent: 'space-between',
  },
  bestSongBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(999),
  },
  bestSongRank: {
    color: '#fff',
    fontWeight: '700',
    fontSize: normalize(14),
  },
  bestSongInfo: {
    gap: normalize(4),
  },
  bestSongTitle: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '700',
  },
  bestSongArtist: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: normalize(13),
  },
  section: {
    gap: normalize(12),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: normalize(22),
    fontWeight: '600',
  },
  sectionTitle2: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
    marginBottom: normalize(10),
  },
  searchInput: {
    marginTop: normalize(8),
    marginBottom: normalize(4),
    paddingHorizontal: normalize(14),
    paddingVertical: normalize(8),
    borderRadius: normalize(999),
    backgroundColor: 'rgba(0,0,0,0.25)',
    color: '#fff',
  },
  chipRowScrollContent: {
    gap: normalize(10),
    paddingRight: normalize(24),
  },
  genreChip: {
    borderRadius: normalize(999),
    paddingVertical: normalize(8),
    paddingHorizontal: normalize(16),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  genreChipText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyGenres: {
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
  horizontalList: {
    gap: normalize(16),
  },
  mixCard: {
    width: normalize(180),
    height: normalize(110),
    borderRadius: normalize(16),
    backgroundColor: '#181818',
    padding: normalize(16),
    justifyContent: 'flex-end',
  },
  mixTitle: {
    color: '#fff',
    fontWeight: '700',
  },
  mixSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(12),
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(10),
  },
  playlistCard: {
    flexBasis: '48%',
    borderRadius: normalize(18),
    padding: normalize(16),
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: normalize(12),
  },
  playlistCoverImage: {
    width: '100%',
    height: normalize(120),
    borderRadius: normalize(12),
    backgroundColor: '#222',
  },
  playlistCoverPlaceholder: {
    width: '100%',
    height: normalize(120),
    borderRadius: normalize(12),
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistCoverText: {
    color: '#fff',
    fontSize: normalize(32),
    fontWeight: '700',
  },
  playlistTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: normalize(14),
    marginBottom: normalize(4),
  },
  playlistSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: normalize(12),
    lineHeight: normalize(16),
  },
  verticalStack: {
    gap: normalize(14),
  },
  continueCard: {
    backgroundColor: '#181818',
    borderRadius: normalize(18),
    padding: normalize(16),
    gap: normalize(8),
  },
  continueMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  continueTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  continueArtist: {
    color: 'rgba(255,255,255,0.6)',
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
  artistRow: {
    flexDirection: 'row',
    gap: normalize(16),
  },
  artistItem: {
    alignItems: 'center',
    gap: normalize(8),
  },
  artistAvatar: {
    width: normalize(64),
    height: normalize(64),
    borderRadius: normalize(32),
  },
  artistName: {
    color: '#fff',
    fontWeight: '500',
  },
  liveCard: {
    width: normalize(180),
    padding: normalize(16),
    borderRadius: normalize(18),
    backgroundColor: '#16222a',
    gap: normalize(6),
  },
  liveLabel: {
    color: '#ff4b2b',
    fontWeight: '700',
    letterSpacing: 2,
  },
  liveTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  liveListeners: {
    color: 'rgba(255,255,255,0.6)',
  },
  podcastScrollContent: {
    gap: normalize(5),
    paddingRight: normalize(24),
  },
  podcastCard: {
    width: normalize(140),
    gap: normalize(8),
  },
  podcastCover: {
    width: normalize(120),
    height: normalize(170),
    borderRadius: normalize(16),
    backgroundColor: '#222',
  },
  podcastBadge: {
    width: normalize(46),
    height: normalize(46),
    borderRadius: normalize(8),
    backgroundColor: '#4b79a1',
  },
  podcastTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: normalize(14),
  },
  podcastDuration: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
  viewAllText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
    fontWeight: '500',
  },
  newsList: {
    gap: normalize(10),
  },
  newsCard: {
    borderRadius: normalize(14),
    padding: normalize(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: normalize(6),
  },
  newsCardBackgroundImage: {
    borderRadius: normalize(14),
  },
  newsCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: normalize(14),
  },
  newsCardContent: {
    gap: normalize(6),
  },
  newsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(4),
  },
  newsDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: normalize(11),
  },
  newsTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: normalize(14),
  },
  newsSummary: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(12),
  },
  musicVideoScrollContent: {
    gap: normalize(20),
    paddingRight: normalize(24),
  },
  musicVideoCard: {
    width: normalize(120),
    alignItems: 'center',
    gap: normalize(8),
  },
  musicVideoCover: {
    width: normalize(120),
    height: normalize(120),
    borderRadius: normalize(60),
    backgroundColor: '#222',
  },
  musicVideoTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: normalize(14),
    textAlign: 'center',
  },
  musicVideoArtist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
    textAlign: 'center',
  },
  playLabel: {
    color: '#fff',
    fontWeight: '700',
  },
  songList: {
    gap: normalize(12),
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#111',
    borderRadius: normalize(16),
    gap: normalize(12),
  },
  songCover: {
    width: normalize(52),
    height: normalize(52),
    borderRadius: 12,
    backgroundColor: '#222',
  },
  songRowActive: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  songMeta: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontWeight: '600',
  },
  songArtist: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
  songDuration: {
    color: 'rgba(255,255,255,0.7)',
  },
  songDurationActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(40),
    gap: normalize(12),
  },
  loadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(14),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: normalize(40),
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(14),
    fontStyle: 'italic',
  },
});

export default HomeScreen;
