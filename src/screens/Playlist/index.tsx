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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-expect-error: FontAwesome6 lacks bundled types.
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

import { COLORS } from '../../config/color';
import { usePlaylist } from '../../components/PlaylistContext';
import { usePlayer } from '../../components/Player';

const PlaylistScreen = () => {
  const { songs, removeSong, clear } = usePlaylist();
  const { playSong, currentSong, isPlaying } = usePlayer();
  const insets = useSafeAreaInsets();

  const paddingBottom = normalize(100);

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
              contentContainerStyle={[styles.listContent, { paddingBottom }]}
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
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.playButton}
                        onPress={() => playSong(item)}>
                        <FontAwesome6
                          name={isActive ? 'pause' : 'play'}
                          size={12}
                          color={COLORS.primary}
                        />
                        <Text style={styles.playlistAction}>
                          {isActive ? 'Playing' : 'Play'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.removeButton}
                        onPress={() => removeSong(item.url)}>
                        <FontAwesome6
                          name="trash-can"
                          size={12}
                          color="rgba(255,100,100,0.9)"
                        />
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
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: normalize(12),
  },
  playlistActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: normalize(8),
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(999),
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(6),
    borderRadius: normalize(999),
    backgroundColor: 'rgba(255,100,100,0.1)',
  },
  removeText: {
    color: 'rgba(255,100,100,0.9)',
    fontSize: normalize(11),
    fontWeight: '600',
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


