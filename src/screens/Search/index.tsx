import React, { useState, useMemo } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import normalize from 'react-native-normalize';

import { COLORS } from '../../config/color';
import { SONGS } from '../../storage/songs';
import { usePlayer } from '../../components/Player';
import { useToast } from '../../components/Toast';
import { usePlaylist } from '../../components/PlaylistContext';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const { playSong, currentSong, isPlaying } = usePlayer();
  const { showToast } = useToast();
  const { songs: playlistSongs, addSong } = usePlaylist();

  const filteredSongs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return SONGS;
    }
    return SONGS.filter(song => {
      return (
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q)
      );
    });
  }, [query]);

  const handleAddToPlaylist = (song: (typeof SONGS)[number]) => {
    const alreadyIn = playlistSongs.some(s => s.url === song.url);
    if (alreadyIn) {
      showToast({ message: 'Song already in playlist', type: 'info' });
      return;
    }
    addSong(song);
    showToast({ message: `Added ${song.title} to playlist`, type: 'success' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Search</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Songs, artists, playlists..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={query}
          onChangeText={setQuery}
        />

        <Text style={styles.sectionLabel}>Songs</Text>
        <FlatList
          data={filteredSongs}
          keyExtractor={item => item.url}
          contentContainerStyle={styles.suggestionList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isActive = currentSong?.url === item.url && isPlaying;
            const isInPlaylist = playlistSongs.some(s => s.url === item.url);
            return (
              <View
                style={[
                  styles.suggestionRow,
                  isActive && { borderColor: COLORS.primary, borderWidth: 1 },
                ]}>
                <View style={styles.suggestionBadge}>
                  <Image
                    source={{ uri: item.cover }}
                    style={styles.suggestionBadge}
                    resizeMode="cover"
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={{ flex: 1 }}
                  onPress={() => {
                    playSong(item);
                    showToast({
                      message: `Playing ${item.title}`,
                      type: 'info',
                    });
                  }}>
                  <Text style={styles.suggestionTitle}>{item.title}</Text>
                  <Text style={styles.suggestionMeta}>{item.artist}</Text>
                </TouchableOpacity>
                <View style={styles.actionsColumn}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      playSong(item);
                      showToast({
                        message: `Playing ${item.title}`,
                        type: 'info',
                      });
                    }}>
                    <Text style={styles.suggestionAction}>
                      {isActive ? 'Playing' : 'Play'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isInPlaylist}
                    onPress={() => handleAddToPlaylist(item)}>
                    <Text
                      style={[
                        styles.addAction,
                        isInPlaylist && styles.addActionDisabled,
                      ]}>
                      {isInPlaylist ? 'Added' : 'Add'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.purple,

    paddingTop: normalize(24),
    paddingBottom: normalize(100),
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
    paddingVertical: normalize(12),
    backgroundColor: '#111',
    color: '#fff',
    fontSize: normalize(16),
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: normalize(12),
  },
  suggestionList: {
    gap: normalize(12),
    paddingBottom: normalize(120),
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121212',
    borderRadius: normalize(16),
    padding: normalize(16),
    gap: normalize(12),
  },
  suggestionBadge: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(12),
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
  },
  suggestionTitle: {
    color: '#fff',
    fontSize: normalize(16),
    fontWeight: '600',
  },
  suggestionMeta: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
  suggestionAction: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  actionsColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: normalize(4),
  },
  addAction: {
    color: '#fff',
    fontWeight: '600',
    fontSize: normalize(12),
  },
  addActionDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
});

export default SearchScreen;