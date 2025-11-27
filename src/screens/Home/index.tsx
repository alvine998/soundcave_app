import React, { useMemo, useState, useCallback } from 'react';
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
  TextInput,
} from 'react-native';
import normalize from 'react-native-normalize';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { usePlayer } from '../../components/Player';
import { useToast } from '../../components/Toast';
import { COLORS } from '../../config/color';
import { UserProfile } from '../../storage/userStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SONGS } from '../../storage/songs';

type RootStackParamList = {
  Home: undefined;
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
};

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
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

const PODCASTS = [
  {
    id: 'pod-1',
    title: 'Soundcave Sessions',
    duration: '42 min',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FZara%20Salsabila%2FWhatsApp%20Image%202025-11-22%20at%2000.46.52.jpeg?alt=media&token=7a4d504f-dd2c-43e4-958c-4f2dd133e51c',
  },
  {
    id: 'pod-2',
    title: 'Future Frequencies',
    duration: '31 min',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FFani%20Fabianto%2FWhatsApp%20Image%202025-11-22%20at%2021.54.21.jpeg?alt=media&token=93230949-8f1b-41b6-a4b2-b7436a892665',
  },
  {
    id: 'pod-3',
    title: 'Indie Talks',
    duration: '28 min',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FUnknown%2FWhatsApp%20Image%202025-11-24%20at%2021.36.15%20(1).jpeg?alt=media&token=443eb6c3-6e4b-4809-a678-bc7104662f58',
  },
  {
    id: 'pod-4',
    title: 'Music Makers',
    duration: '35 min',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FZara%20Salsabila%2FWhatsApp%20Image%202025-11-22%20at%2000.46.52.jpeg?alt=media&token=7a4d504f-dd2c-43e4-958c-4f2dd133e51c',
  },
];

const MUSIC_VIDEOS = [
  {
    id: 'mv-1',
    title: 'Seperti Kemarin',
    artist: 'Zara Salsabila',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FZara%20Salsabila%2FWhatsApp%20Image%202025-11-22%20at%2000.46.52.jpeg?alt=media&token=7a4d504f-dd2c-43e4-958c-4f2dd133e51c',
  },
  {
    id: 'mv-2',
    title: 'Telah Pergi',
    artist: 'Fani Fabianto',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FFani%20Fabianto%2FWhatsApp%20Image%202025-11-22%20at%2021.54.21.jpeg?alt=media&token=93230949-8f1b-41b6-a4b2-b7436a892665',
  },
  {
    id: 'mv-3',
    title: 'Track 01',
    artist: 'Original Soundcave',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FUnknown%2FWhatsApp%20Image%202025-11-24%20at%2021.36.15%20(1).jpeg?alt=media&token=443eb6c3-6e4b-4809-a678-bc7104662f58',
  },
  {
    id: 'mv-4',
    title: 'Track 02',
    artist: 'Original Soundcave',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FZara%20Salsabila%2FWhatsApp%20Image%202025-11-22%20at%2000.46.52.jpeg?alt=media&token=7a4d504f-dd2c-43e4-958c-4f2dd133e51c',
  },
  {
    id: 'mv-5',
    title: 'Track 03',
    artist: 'Original Soundcave',
    cover:
      'https://firebasestorage.googleapis.com/v0/b/tokotitoh-cd962.appspot.com/o/soundcave%2Fmusic%2Fsongs%2FFani%20Fabianto%2FWhatsApp%20Image%202025-11-22%20at%2021.54.21.jpeg?alt=media&token=93230949-8f1b-41b6-a4b2-b7436a892665',
  },
];

const LIVE_SESSIONS = [
  { id: 'live-1', title: 'Night Swim Radio', listeners: '12K' },
  { id: 'live-2', title: 'Studio B Unplugged', listeners: '8.4K' },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ profile, onLogout }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { showToast } = useToast();
  const { playSong, currentSong, isPlaying } = usePlayer();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // If later you load data from API/storage, trigger it here
    // For now we just simulate a short refresh and show a toast
    setTimeout(() => {
      setRefreshing(false);
      showToast({ message: 'Home refreshed', type: 'info' });
    }, 800);
  }, [showToast]);

  const selectedGenres = profile.selectedGenres ?? [];
  const paddingTop = Math.max(insets.top, normalize(24));
  const paddingBottom = Math.max(insets.bottom, normalize(10)) + normalize(30);

  const filteredSongs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return SONGS;
    }
    return SONGS.filter(song => {
      return (
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

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
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.name}>{profile.fullName}</Text>
            </View>
            <Text style={styles.sectionTitle2}>Most Played</Text>
          </View>
          <View style={styles.bestSongsContainer}>
            {/* Right side: Song #1 (large) */}
            {SONGS.slice(0, 1).map(song => {
              const isActive = currentSong?.url === song.url && isPlaying;
              return (
                <TouchableOpacity
                  key={song.url}
                  activeOpacity={0.85}
                  style={[
                    styles.bestSongCardLarge,
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
                  <Image
                    source={{ uri: song.cover }}
                    style={styles.bestSongCover}
                    resizeMode="cover"
                  />
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
            {/* Left side: Song #2 and #3 stacked */}
            <View style={styles.bestSongsLeft}>
              {SONGS.slice(1, 3).map((song, index) => {
                const isActive = currentSong?.url === song.url && isPlaying;
                const actualIndex = index + 2; // #2 and #3
                return (
                  <TouchableOpacity
                    key={song.url}
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
                    <Image
                      source={{ uri: song.cover }}
                      style={styles.bestSongCover}
                      resizeMode="cover"
                    />
                    <View style={styles.bestSongOverlay}>
                      <View style={styles.bestSongBadge}>
                        <Text style={styles.bestSongRank}>#{actualIndex}</Text>
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
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your vibe</Text>
          <View style={styles.chipRow}>
            {selectedGenres.slice(0, 5).map(genre => (
              <View key={genre} style={styles.genreChip}>
                <Text style={styles.genreChipText}>{genre}</Text>
              </View>
            ))}
            {!selectedGenres.length && (
              <Text style={styles.emptyGenres}>
                You haven't picked any genres yet.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Podcasts</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.podcastScrollContent}
          >
            {PODCASTS.map(podcast => (
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Music Video</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.musicVideoScrollContent}
          >
            {MUSIC_VIDEOS.map(video => (
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest drops</Text>
          <View style={styles.songList}>
            {filteredSongs.map(song => {
              const isActive = currentSong?.url === song.url && isPlaying;
              return (
                <TouchableOpacity
                  key={song.url}
                  activeOpacity={0.85}
                  style={[styles.songRow, isActive && styles.songRowActive]}
                  onPress={() => {
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
          <View style={styles.playlistGrid}>
            {TOP_PLAYLISTS.map(item => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={styles.playlistCard}
              >
                <Text style={styles.playlistTitle}>{item.title}</Text>
                <Text style={styles.playlistSubtitle}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
          <Text style={styles.sectionTitle}>Podcasts & stories</Text>
          <View style={styles.verticalStack}>
            {PODCASTS.map(podcast => (
              <View key={podcast.id} style={styles.podcastCard}>
                <View style={styles.podcastBadge} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.podcastTitle}>{podcast.title}</Text>
                  <Text style={styles.podcastDuration}>{podcast.duration}</Text>
                </View>
                <TouchableOpacity activeOpacity={0.8}>
                  <Text style={styles.playLabel}>Play</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
    marginTop: normalize(8),
  },
  greeting: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(14),
  },
  name: {
    fontSize: normalize(30),
    fontWeight: '700',
    color: '#fff',
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
  bestSongsContainer: {
    flexDirection: 'row',
    gap: normalize(5),
    height: normalize(200),
  },
  bestSongsLeft: {
    flex: 0.25,
    gap: normalize(5),
  },
  bestSongCardSmall: {
    flex: 1,
    borderRadius: normalize(10),
    overflow: 'hidden',
    backgroundColor: '#111',
    position: 'relative',
  },
  bestSongCardLarge: {
    flex: 0.75,
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(10),
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
  },
  playlistTitle: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: normalize(6),
  },
  playlistSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: normalize(12),
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
    backgroundColor: '#111',
    borderRadius: normalize(16),
    padding: normalize(14),
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
});

export default HomeScreen;
