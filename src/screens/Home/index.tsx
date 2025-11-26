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

import { usePlayer } from '../../components/Player';
import { useToast } from '../../components/Toast';
import { COLORS } from '../../config/color';
import { UserProfile } from '../../storage/userStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SONGS } from '../../storage/songs';

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
  { id: 'pod-1', title: 'Soundcave Sessions', duration: '42 min' },
  { id: 'pod-2', title: 'Future Frequencies', duration: '31 min' },
];

const LIVE_SESSIONS = [
  { id: 'live-1', title: 'Night Swim Radio', listeners: '12K' },
  { id: 'live-2', title: 'Studio B Unplugged', listeners: '8.4K' },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ profile, onLogout }) => {
  const insets = useSafeAreaInsets();
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
  const paddingBottom = normalize(30) + insets.bottom;

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
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{profile.fullName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              showToast({ message: 'Logging out...', type: 'info' });
              onLogout();
            }}
            activeOpacity={0.8}
            style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <ImageBackground
          source={require('../../assets/images/logo_s_white.png')}
          imageStyle={{ opacity: 0.08 }}
          style={styles.heroCard}>
          <Text style={styles.heroLabel}>For you</Text>
          <Text style={styles.heroTitle}>Dive back into your saved genres</Text>
          <TouchableOpacity activeOpacity={0.85} style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Resume Playing</Text>
          </TouchableOpacity>
        </ImageBackground>

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
                You haven’t picked any genres yet.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest drops</Text>
          <TextInput
            placeholder="Search songs or artists"
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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
                    showToast({ message: `Playing ${song.title}`, type: 'info' });
                  }}>
                  <Image source={{ uri: song.cover }} style={styles.songCover} />
                  <View style={styles.songMeta}>
                    <Text style={styles.songTitle}>{song.title}</Text>
                    <Text style={styles.songArtist}>{song.artist}</Text>
                  </View>
                  <Text
                    style={[
                      styles.songDuration,
                      isActive && styles.songDurationActive,
                    ]}>
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
            contentContainerStyle={styles.horizontalList}>
            {MOCK_MIXES.map(mix => (
              <TouchableOpacity
                key={mix.id}
                activeOpacity={0.85}
                style={styles.mixCard}>
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
                style={styles.playlistCard}>
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
                  style={[styles.artistAvatar, { backgroundColor: artist.color }]}
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
            contentContainerStyle={styles.horizontalList}>
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
    alignItems: 'center',
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
  heroCard: {
    borderRadius: normalize(24),
    padding: normalize(20),
    backgroundColor: '#1f1b2c',
    overflow: 'hidden',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  heroTitle: {
    color: '#fff',
    fontSize: normalize(28),
    fontWeight: '700',
    marginVertical: normalize(12),
  },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(10),
    borderRadius: normalize(999),
  },
  heroButtonText: {
    color: '#050505',
    fontWeight: '600',
  },
  section: {
    gap: normalize(12),
  },
  sectionTitle: {
    color: '#fff',
    fontSize: normalize(22),
    fontWeight: '600',
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
  podcastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: normalize(16),
    padding: normalize(16),
    gap: normalize(12),
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
  },
  podcastDuration: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
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


