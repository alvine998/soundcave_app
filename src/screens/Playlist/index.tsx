import React from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import normalize from 'react-native-normalize';

import { COLORS } from '../../config/color';
import { usePlaylist } from '../../components/PlaylistContext';
import { usePlayer } from '../../components/Player';

const PlaylistScreen = () => {
  const { songs, removeSong, clear } = usePlaylist();
  const { playSong, currentSong, isPlaying } = usePlayer();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>My playlist</Text>
        <Text style={styles.subtitle}>
          Songs you added from Search live here.
        </Text>

        {songs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No songs in your playlist yet.{'\n'}Go to Search and tap "Add".
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.countText}>{songs.length} songs</Text>
              <TouchableOpacity activeOpacity={0.8} onPress={clear}>
                <Text style={styles.clearText}>Clear all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={songs}
              keyExtractor={item => item.url}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isActive =
                  currentSong?.url === item.url && isPlaying;
                return (
                  <View
                    style={[
                      styles.playlistRow,
                      isActive && {
                        borderColor: COLORS.primary,
                        borderWidth: 1,
                      },
                    ]}>
                    <Image
                      source={{ uri: item.cover }}
                      style={styles.playlistBadge}
                    />
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      activeOpacity={0.85}
                      onPress={() => playSong(item)}>
                      <Text style={styles.playlistTitle}>{item.title}</Text>
                      <Text style={styles.playlistMeta}>{item.artist}</Text>
                    </TouchableOpacity>
                    <View style={styles.playlistActions}>
                      <Text style={styles.playlistAction}>
                        {isActive ? 'Playing' : 'Play'}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => removeSong(item.url)}>
                        <Text style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          </>
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
  subtitle: {
    fontSize: normalize(16),
    color: 'rgba(255,255,255,0.65)',
  },
  listContent: {
    marginTop: normalize(16),
    gap: normalize(12),
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: normalize(16),
    padding: normalize(16),
    gap: normalize(12),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  playlistBadge: {
    width: normalize(54),
    height: normalize(54),
    borderRadius: normalize(12),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  playlistTitle: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: '#fff',
  },
  playlistMeta: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: normalize(12),
  },
  playlistAction: {
    color: '#fff',
    fontWeight: '700',
  },
  playlistActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: normalize(6),
  },
  removeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: normalize(12),
  },
  emptyState: {
    marginTop: normalize(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  headerRow: {
    marginTop: normalize(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: {
    color: 'rgba(255,255,255,0.7)',
  },
  clearText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default PlaylistScreen;


